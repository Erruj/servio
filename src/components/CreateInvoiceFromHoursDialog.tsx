import { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface TimeEntry {
  id: string;
  customer_id: string | null;
  project: string | null;
  description: string | null;
  start_time: string;
  end_time: string | null;
  duration_minutes: number | null;
  hourly_rate: number | null;
  billable: boolean;
  invoiced: boolean;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entries: TimeEntry[];
  customers: { id: string; name: string }[];
  onDone: () => void;
}

export function CreateInvoiceFromHoursDialog({ open, onOpenChange, entries, customers, onDone }: Props) {
  const [customerId, setCustomerId] = useState('');
  const [vatRate, setVatRate] = useState('21');
  const [loading, setLoading] = useState(false);

  const eligible = useMemo(
    () => entries.filter(e => e.billable && !e.invoiced && e.duration_minutes && e.hourly_rate && e.customer_id === customerId),
    [entries, customerId]
  );

  const customer = customers.find(c => c.id === customerId);
  const subtotal = eligible.reduce((s, e) => s + ((e.duration_minutes || 0) / 60) * (e.hourly_rate || 0), 0);
  const vat = subtotal * (Number(vatRate) / 100);
  const total = subtotal + vat;

  const customersWithHours = useMemo(() => {
    const ids = new Set(
      entries.filter(e => e.billable && !e.invoiced && e.duration_minutes && e.hourly_rate && e.customer_id).map(e => e.customer_id!)
    );
    return customers.filter(c => ids.has(c.id));
  }, [entries, customers]);

  const handleGenerate = async () => {
    if (!customer || eligible.length === 0) {
      toast.error('Selecteer een klant met openstaande uren');
      return;
    }
    setLoading(true);
    try {
      const { data: userRes } = await supabase.auth.getUser();
      if (!userRes.user) throw new Error('Not authenticated');

      // Profielinfo voor factuur header
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, company_name, email, vat_number')
        .eq('id', userRes.user.id)
        .maybeSingle();

      const { data: cust } = await supabase
        .from('customers')
        .select('name, address, postal_code, city, country, vat_number, email')
        .eq('id', customerId)
        .maybeSingle();

      // PDF
      const doc = new jsPDF();
      const invoiceNumber = `F-${Date.now().toString().slice(-6)}`;
      const today = new Date();

      doc.setFontSize(20);
      doc.text('FACTUUR', 14, 20);
      doc.setFontSize(10);
      doc.text(`Factuurnr: ${invoiceNumber}`, 14, 28);
      doc.text(`Datum: ${format(today, 'd MMMM yyyy', { locale: nl })}`, 14, 33);

      // Afzender
      doc.setFontSize(11);
      doc.text('Van:', 14, 45);
      doc.setFontSize(10);
      doc.text(profile?.company_name || profile?.full_name || '', 14, 51);
      if (profile?.email) doc.text(profile.email, 14, 56);
      if (profile?.vat_number) doc.text(`BTW: ${profile.vat_number}`, 14, 61);

      // Klant
      doc.setFontSize(11);
      doc.text('Aan:', 120, 45);
      doc.setFontSize(10);
      doc.text(cust?.name || customer.name, 120, 51);
      if (cust?.address) doc.text(cust.address, 120, 56);
      if (cust?.postal_code || cust?.city) doc.text(`${cust?.postal_code || ''} ${cust?.city || ''}`.trim(), 120, 61);
      if (cust?.vat_number) doc.text(`BTW: ${cust.vat_number}`, 120, 66);

      autoTable(doc, {
        startY: 80,
        head: [['Datum', 'Project/Omschrijving', 'Uren', 'Tarief', 'Bedrag']],
        body: eligible.map(e => {
          const hours = (e.duration_minutes || 0) / 60;
          const amount = hours * (e.hourly_rate || 0);
          return [
            format(new Date(e.start_time), 'dd-MM-yy'),
            [e.project, e.description].filter(Boolean).join(' – ') || '-',
            hours.toFixed(2),
            `€ ${(e.hourly_rate || 0).toFixed(2)}`,
            `€ ${amount.toFixed(2)}`,
          ];
        }),
        styles: { fontSize: 9 },
        headStyles: { fillColor: [59, 130, 246] },
      });

      const finalY = (doc as any).lastAutoTable.finalY + 10;
      doc.setFontSize(10);
      doc.text(`Subtotaal:`, 140, finalY); doc.text(`€ ${subtotal.toFixed(2)}`, 195, finalY, { align: 'right' });
      doc.text(`BTW (${vatRate}%):`, 140, finalY + 6); doc.text(`€ ${vat.toFixed(2)}`, 195, finalY + 6, { align: 'right' });
      doc.setFontSize(12);
      doc.text(`Totaal:`, 140, finalY + 14); doc.text(`€ ${total.toFixed(2)}`, 195, finalY + 14, { align: 'right' });

      const blob = doc.output('blob');
      const fileName = `${invoiceNumber}.pdf`;
      const filePath = `${userRes.user.id}/${fileName}`;

      const { error: upErr } = await supabase.storage.from('invoices').upload(filePath, blob, {
        contentType: 'application/pdf',
        upsert: false,
      });
      if (upErr) throw upErr;

      // Maak invoice record zodat factuur in lijst verschijnt
      const { error: invErr } = await supabase.from('invoices').insert({
        user_id: userRes.user.id,
        file_path: filePath,
        invoice_number: invoiceNumber,
        invoice_date: today.toISOString().slice(0, 10),
        supplier: profile?.company_name || profile?.full_name || 'Eigen factuur',
        customer_id: customerId,
        amount: total,
        vat_amount: vat,
        status: 'pending',
      });
      if (invErr) console.warn('Invoice record niet aangemaakt:', invErr.message);

      // Mark uren als gefactureerd
      const ids = eligible.map(e => e.id);
      await supabase.from('time_entries').update({ invoiced: true }).in('id', ids);

      // Download voor gebruiker
      doc.save(fileName);

      toast.success(`Factuur ${invoiceNumber} aangemaakt (${eligible.length} uren-regels)`);
      onOpenChange(false);
      setCustomerId('');
      onDone();
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Fout bij genereren factuur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Factuur uit uren</DialogTitle>
          <DialogDescription>Genereer een PDF factuur van alle niet-gefactureerde, declarabele uren per klant.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Klant</Label>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger><SelectValue placeholder="Kies een klant" /></SelectTrigger>
                <SelectContent>
                  {customersWithHours.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground">Geen klanten met openstaande uren</div>
                  ) : customersWithHours.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>BTW %</Label>
              <Input type="number" value={vatRate} onChange={e => setVatRate(e.target.value)} />
            </div>
          </div>

          {customerId && (
            <>
              <div className="border rounded-md max-h-64 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Datum</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead className="text-right">Uren</TableHead>
                      <TableHead className="text-right">Bedrag</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {eligible.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-4">Geen openstaande uren</TableCell></TableRow>
                    ) : eligible.map(e => {
                      const hours = (e.duration_minutes || 0) / 60;
                      return (
                        <TableRow key={e.id}>
                          <TableCell>{format(new Date(e.start_time), 'd MMM', { locale: nl })}</TableCell>
                          <TableCell className="text-sm">{e.project || e.description || '-'}</TableCell>
                          <TableCell className="text-right">{hours.toFixed(2)}</TableCell>
                          <TableCell className="text-right">€ {(hours * (e.hourly_rate || 0)).toFixed(2)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-end gap-6 text-sm pt-2">
                <div className="space-y-1 text-right">
                  <div className="text-muted-foreground">Subtotaal: <span className="text-foreground font-medium">€ {subtotal.toFixed(2)}</span></div>
                  <div className="text-muted-foreground">BTW ({vatRate}%): <span className="text-foreground font-medium">€ {vat.toFixed(2)}</span></div>
                  <div className="text-base font-bold">Totaal: € {total.toFixed(2)}</div>
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Annuleren</Button>
          <Button onClick={handleGenerate} disabled={loading || eligible.length === 0}>
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileText className="h-4 w-4 mr-2" />}
            Genereer & Download
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
