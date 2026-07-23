import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Search, Trash2, FileText, ArrowRight, Download, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { AdminBreadcrumb } from '@/components/AdminBreadcrumb';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

interface Customer { id: string; name: string; company_name: string | null; email: string | null; }
interface QuoteLine { id?: string; description: string; quantity: number; unit_price: number; vat_rate: number; total: number; sort_order: number; }
interface Quote {
  id: string; quote_number: string | null; status: string; description: string | null;
  subtotal: number; vat_amount: number; total: number; valid_until: string | null;
  notes: string | null; customer_id: string | null; created_at: string;
}

const statusColors: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  sent: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  accepted: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  expired: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
};
const statusLabels: Record<string, string> = { draft: 'Concept', sent: 'Verzonden', accepted: 'Geaccepteerd', rejected: 'Afgewezen', expired: 'Verlopen' };

export default function Quotes() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerMap, setCustomerMap] = useState<Record<string, Customer>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showEditor, setShowEditor] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  const [customerId, setCustomerId] = useState<string>('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [validDays, setValidDays] = useState(30);
  const [lines, setLines] = useState<QuoteLine[]>([{ description: '', quantity: 1, unit_price: 0, vat_rate: 21, total: 0, sort_order: 0 }]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;
      const [quotesRes, customersRes] = await Promise.all([
        supabase.from('quotes').select('*').eq('user_id', user.user.id).order('created_at', { ascending: false }),
        supabase.from('customers').select('id, name, company_name, email').eq('user_id', user.user.id).order('name'),
      ]);
      if (quotesRes.error) throw quotesRes.error;
      setQuotes((quotesRes.data as any[]) || []);
      const custs = (customersRes.data as any[]) || [];
      setCustomers(custs);
      const map: Record<string, Customer> = {};
      custs.forEach(c => map[c.id] = c);
      setCustomerMap(map);
    } catch (error) {
      console.error('Error loading quotes:', error);
      toast.error('Offertes konden niet worden geladen');
    } finally {
      setLoading(false);
    }
  };


  const calcLine = (l: QuoteLine): QuoteLine => {
    const subtotal = l.quantity * l.unit_price;
    return { ...l, total: subtotal + (subtotal * l.vat_rate / 100) };
  };

  const updateLine = (idx: number, field: string, value: any) => {
    const updated = [...lines];
    updated[idx] = { ...updated[idx], [field]: value };
    updated[idx] = calcLine(updated[idx]);
    setLines(updated);
  };

  const subtotal = lines.reduce((a, l) => a + l.quantity * l.unit_price, 0);
  const vatAmount = lines.reduce((a, l) => a + (l.quantity * l.unit_price * l.vat_rate / 100), 0);
  const total = subtotal + vatAmount;

  const handleSave = async () => {
    if (lines.every(l => !l.description.trim())) { toast.error('Voeg minimaal één regel toe'); return; }
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;

    const validLines = lines.filter(l => l.description.trim());
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + validDays);

    if (editingId) {
      const { error } = await supabase.from('quotes').update({
        customer_id: customerId || null, description, notes, subtotal, vat_amount: vatAmount, total,
        valid_until: validUntil.toISOString().split('T')[0],
      }).eq('id', editingId);
      if (error) { toast.error('Fout bij opslaan'); return; }
      // Delete old lines, insert new
      await supabase.from('quote_lines').delete().eq('quote_id', editingId);
      await supabase.from('quote_lines').insert(validLines.map((l, i) => ({
        quote_id: editingId, description: l.description, quantity: l.quantity,
        unit_price: l.unit_price, vat_rate: l.vat_rate, total: l.total, sort_order: i,
      })));
      toast.success('Offerte bijgewerkt');
    } else {
      const quoteNum = `OFF-${Date.now().toString(36).toUpperCase()}`;
      const { data, error } = await supabase.from('quotes').insert({
        user_id: user.user.id, customer_id: customerId || null, quote_number: quoteNum,
        description, notes, subtotal, vat_amount: vatAmount, total, status: 'draft',
        valid_until: validUntil.toISOString().split('T')[0],
      }).select('id').single();
      if (error || !data) { toast.error('Fout bij aanmaken'); return; }
      await supabase.from('quote_lines').insert(validLines.map((l, i) => ({
        quote_id: data.id, description: l.description, quantity: l.quantity,
        unit_price: l.unit_price, vat_rate: l.vat_rate, total: l.total, sort_order: i,
      })));
      toast.success('Offerte aangemaakt');
    }
    resetForm();
    loadData();
  };

  const resetForm = () => {
    setShowEditor(false); setEditingId(null); setCustomerId(''); setDescription(''); setNotes('');
    setValidDays(30); setLines([{ description: '', quantity: 1, unit_price: 0, vat_rate: 21, total: 0, sort_order: 0 }]);
  };

  const handleEdit = async (q: Quote) => {
    setEditingId(q.id);
    setCustomerId(q.customer_id || '');
    setDescription(q.description || '');
    setNotes(q.notes || '');
    const { data: lineData } = await supabase.from('quote_lines').select('*').eq('quote_id', q.id).order('sort_order');
    setLines((lineData as any[])?.length ? (lineData as any[]) : [{ description: '', quantity: 1, unit_price: 0, vat_rate: 21, total: 0, sort_order: 0 }]);
    setShowEditor(true);
  };

  const handleStatusChange = async (id: string, status: string) => {
    await supabase.from('quotes').update({ status }).eq('id', id);
    toast.success(`Status gewijzigd naar ${statusLabels[status]}`);
    loadData();
  };

  const handleConvertToInvoice = async (q: Quote) => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;
    const customer = q.customer_id ? customerMap[q.customer_id] : null;
    const { error } = await supabase.from('invoices').insert({
      user_id: user.user.id, customer_id: q.customer_id, supplier: customer?.name || 'Klant',
      amount: q.total, vat_amount: q.vat_amount, status: 'pending', file_path: `quote-${q.id}`,
      invoice_number: `INV-${Date.now().toString(36).toUpperCase()}`,
      invoice_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    });
    if (error) { toast.error('Fout bij omzetten'); return; }
    await supabase.from('quotes').update({ status: 'accepted' }).eq('id', q.id);
    toast.success('Offerte omgezet naar factuur');
    loadData();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await supabase.from('quotes').delete().eq('id', deleteId);
    toast.success('Offerte verwijderd');
    setDeleteId(null);
    loadData();
  };

  const handleDownloadPDF = (q: Quote) => {
    const customer = q.customer_id ? customerMap[q.customer_id] : null;
    const html = `<!DOCTYPE html><html><head><style>
      body{font-family:Arial,sans-serif;padding:40px;color:#333}
      h1{color:#6366f1;margin-bottom:5px} .header{display:flex;justify-content:space-between;margin-bottom:40px}
      table{width:100%;border-collapse:collapse;margin:20px 0} th,td{border:1px solid #ddd;padding:10px;text-align:left}
      th{background:#f5f5f5} .total{text-align:right;font-size:18px;font-weight:bold;margin-top:10px}
      .badge{display:inline-block;padding:4px 12px;border-radius:12px;font-size:12px;background:#e0e7ff;color:#4338ca}
    </style></head><body>
      <div class="header"><div><h1>Servio</h1><p>Offerte ${q.quote_number || ''}</p></div>
      <div style="text-align:right"><p class="badge">${statusLabels[q.status] || q.status}</p>
      <p>Geldig tot: ${q.valid_until ? format(new Date(q.valid_until), 'd MMM yyyy', { locale: nl }) : '-'}</p></div></div>
      ${customer ? `<p><strong>Aan:</strong> ${customer.name}${customer.company_name ? ` (${customer.company_name})` : ''}${customer.email ? `<br>${customer.email}` : ''}</p>` : ''}
      ${q.description ? `<p>${q.description}</p>` : ''}
      <table><tr><th>Omschrijving</th><th>Aantal</th><th>Stukprijs</th><th>BTW</th><th>Totaal</th></tr></table>
      <p class="total">Subtotaal: €${Number(q.subtotal).toFixed(2)}</p>
      <p class="total">BTW: €${Number(q.vat_amount).toFixed(2)}</p>
      <p class="total" style="font-size:22px">Totaal: €${Number(q.total).toFixed(2)}</p>
      ${q.notes ? `<p style="margin-top:30px;color:#666">${q.notes}</p>` : ''}
    </body></html>`;
    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); w.print(); }
  };

  const filtered = quotes.filter(q => {
    if (statusFilter !== 'all' && q.status !== statusFilter) return false;
    const term = searchTerm.toLowerCase();
    if (!term) return true;
    const customer = q.customer_id ? customerMap[q.customer_id] : null;
    return (q.quote_number || '').toLowerCase().includes(term) ||
           (q.description || '').toLowerCase().includes(term) ||
           (customer?.name || '').toLowerCase().includes(term);
  });

  if (showEditor) {
    return (
      <div className="flex min-h-screen bg-background">
        <div className="flex-1 p-4 md:p-8 overflow-auto max-w-4xl mx-auto w-full">
          <AdminBreadcrumb currentPage="Offertes" />
          <h1 className="text-2xl font-bold mb-6">{editingId ? 'Offerte Bewerken' : 'Nieuwe Offerte'}</h1>
          
          <Card className="mb-6">
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Klant</Label>
                  <Select value={customerId} onValueChange={setCustomerId}>
                    <SelectTrigger><SelectValue placeholder="Selecteer klant (optioneel)" /></SelectTrigger>
                    <SelectContent>
                      {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}{c.company_name ? ` (${c.company_name})` : ''}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Geldigheid (dagen)</Label>
                  <Input type="number" value={validDays} onChange={e => setValidDays(Number(e.target.value))} />
                </div>
              </div>
              <div><Label>Omschrijving</Label><Textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} /></div>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-4">Regels</h3>
              {lines.map((line, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 mb-2 items-end">
                  <div className="col-span-5">
                    {idx === 0 && <Label className="text-xs">Omschrijving</Label>}
                    <Input value={line.description} onChange={e => updateLine(idx, 'description', e.target.value)} placeholder="Product of dienst" />
                  </div>
                  <div className="col-span-2">
                    {idx === 0 && <Label className="text-xs">Aantal</Label>}
                    <Input type="number" value={line.quantity} onChange={e => updateLine(idx, 'quantity', Number(e.target.value))} />
                  </div>
                  <div className="col-span-2">
                    {idx === 0 && <Label className="text-xs">Prijs</Label>}
                    <Input type="number" step="0.01" value={line.unit_price} onChange={e => updateLine(idx, 'unit_price', Number(e.target.value))} />
                  </div>
                  <div className="col-span-2">
                    {idx === 0 && <Label className="text-xs">BTW %</Label>}
                    <Select value={String(line.vat_rate)} onValueChange={v => updateLine(idx, 'vat_rate', Number(v))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">0%</SelectItem>
                        <SelectItem value="9">9%</SelectItem>
                        <SelectItem value="21">21%</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-1">
                    <Button variant="ghost" size="icon" onClick={() => setLines(lines.filter((_, i) => i !== idx))} disabled={lines.length <= 1}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              <Button variant="outline" size="sm" className="mt-2" onClick={() => setLines([...lines, { description: '', quantity: 1, unit_price: 0, vat_rate: 21, total: 0, sort_order: lines.length }])}>
                <Plus className="h-4 w-4 mr-1" /> Regel toevoegen
              </Button>

              <div className="mt-6 space-y-1 text-right">
                <p className="text-sm text-muted-foreground">Subtotaal: <span className="font-medium text-foreground">€{subtotal.toFixed(2)}</span></p>
                <p className="text-sm text-muted-foreground">BTW: <span className="font-medium text-foreground">€{vatAmount.toFixed(2)}</span></p>
                <p className="text-lg font-bold">Totaal: €{total.toFixed(2)}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardContent className="pt-6">
              <Label>Notities</Label>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Voorwaarden, opmerkingen..." />
            </CardContent>
          </Card>

          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={resetForm}>Annuleren</Button>
            <Button onClick={handleSave}>{editingId ? 'Opslaan' : 'Offerte Aanmaken'}</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <div className="flex-1 p-4 md:p-8 overflow-auto">
        <AdminBreadcrumb currentPage="Offertes" />

        <PageHeader
          title="Offertes"
          description="Maak en beheer je offertes"
          actions={
            <Button onClick={() => { resetForm(); setShowEditor(true); }}>
              <Plus className="h-4 w-4 mr-2" /> Nieuwe Offerte
            </Button>
          }
        />


        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {(['draft', 'sent', 'accepted', 'rejected'] as const).map(s => (
            <Card key={s} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter(statusFilter === s ? 'all' : s)}>
              <CardContent className="pt-6 text-center">
                <p className="text-2xl font-bold">{quotes.filter(q => q.status === s).length}</p>
                <p className="text-sm text-muted-foreground">{statusLabels[s]}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search + Filter */}
        <div className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Zoek offertes..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle</SelectItem>
              {Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="text-center py-12 text-muted-foreground">Laden...</div>
            ) : filtered.length === 0 ? (
              quotes.length === 0 ? (
                <EmptyState
                  icon={FileText}
                  title="Nog geen offertes"
                  description="Maak je eerste offerte en stuur hem direct als PDF naar je klant."
                  action={{
                    label: 'Nieuwe offerte',
                    icon: Plus,
                    onClick: () => { resetForm(); setShowEditor(true); },
                  }}
                />
              ) : (
                <EmptyState
                  icon={Search}
                  title="Geen offertes gevonden"
                  description="Pas je zoekterm of filter aan om resultaten te zien."
                />
              )
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nummer</TableHead>
                    <TableHead>Klant</TableHead>
                    <TableHead className="hidden md:table-cell">Status</TableHead>
                    <TableHead className="hidden md:table-cell">Geldig tot</TableHead>
                    <TableHead className="text-right">Totaal</TableHead>
                    <TableHead>Acties</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(q => {
                    const customer = q.customer_id ? customerMap[q.customer_id] : null;
                    return (
                      <TableRow key={q.id}>
                        <TableCell className="font-medium">{q.quote_number || '-'}</TableCell>
                        <TableCell>{customer?.name || '-'}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge className={statusColors[q.status]}>{statusLabels[q.status] || q.status}</Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {q.valid_until ? format(new Date(q.valid_until), 'd MMM yyyy', { locale: nl }) : '-'}
                        </TableCell>
                        <TableCell className="text-right font-medium">€{Number(q.total).toFixed(2)}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="sm">Acties</Button></DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onClick={() => handleEdit(q)}><Edit className="h-4 w-4 mr-2" /> Bewerken</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDownloadPDF(q)}><Download className="h-4 w-4 mr-2" /> Download PDF</DropdownMenuItem>
                              {q.status === 'draft' && <DropdownMenuItem onClick={() => handleStatusChange(q.id, 'sent')}><ArrowRight className="h-4 w-4 mr-2" /> Markeer verzonden</DropdownMenuItem>}
                              {q.status === 'sent' && <DropdownMenuItem onClick={() => handleStatusChange(q.id, 'accepted')}><ArrowRight className="h-4 w-4 mr-2" /> Markeer geaccepteerd</DropdownMenuItem>}
                              {(q.status === 'sent' || q.status === 'accepted') && (
                                <DropdownMenuItem onClick={() => handleConvertToInvoice(q)}><FileText className="h-4 w-4 mr-2" /> Omzetten naar factuur</DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => setDeleteId(q.id)} className="text-destructive"><Trash2 className="h-4 w-4 mr-2" /> Verwijderen</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>


        <ConfirmDialog
          open={!!deleteId}
          onOpenChange={(open) => !open && setDeleteId(null)}
          title="Offerte verwijderen"
          description="Weet je zeker dat je deze offerte wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt."
          confirmLabel="Verwijderen"
          variant="destructive"
          onConfirm={handleDelete}
        />

      </div>
    </div>
  );
}
