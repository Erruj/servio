import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Search, Edit, Trash2, Users, Mail, Phone, Building, FileText, Receipt } from 'lucide-react';
import { toast } from 'sonner';
import { AdminBreadcrumb } from '@/components/AdminBreadcrumb';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { ConfirmDialog } from '@/components/ConfirmDialog';

interface Customer {
  id: string;
  name: string;
  company_name: string | null;
  email: string | null;
  phone: string | null;
  vat_number: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  country: string | null;
  notes: string | null;
  created_at: string;
}

interface CustomerStats {
  invoiceCount: number;
  quoteCount: number;
  totalInvoiced: number;
}

const emptyForm = {
  name: '', company_name: '', email: '', phone: '', vat_number: '',
  address: '', city: '', postal_code: '', country: 'NL', notes: ''
};

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stats, setStats] = useState<Record<string, CustomerStats>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [detailCustomer, setDetailCustomer] = useState<Customer | null>(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => { loadCustomers(); }, []);

  const loadCustomers = async () => {
    setLoading(true);
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;

    const { data, error } = await supabase.from('customers').select('*').eq('user_id', user.user.id).order('name');
    if (error) { toast.error('Fout bij laden klanten'); return; }
    setCustomers((data as any[]) || []);

    // Load stats
    const { data: invoices } = await supabase.from('invoices').select('customer_id, amount').eq('user_id', user.user.id);
    const { data: quotes } = await supabase.from('quotes').select('customer_id').eq('user_id', user.user.id);
    
    const s: Record<string, CustomerStats> = {};
    (data || []).forEach((c: any) => {
      s[c.id] = { invoiceCount: 0, quoteCount: 0, totalInvoiced: 0 };
    });
    (invoices || []).forEach((inv: any) => {
      if (inv.customer_id && s[inv.customer_id]) {
        s[inv.customer_id].invoiceCount++;
        s[inv.customer_id].totalInvoiced += Number(inv.amount) || 0;
      }
    });
    (quotes || []).forEach((q: any) => {
      if (q.customer_id && s[q.customer_id]) {
        s[q.customer_id].quoteCount++;
      }
    });
    setStats(s);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Naam is verplicht'); return; }
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;

    const payload = { ...form, user_id: user.user.id };
    
    if (editingId) {
      const { error } = await supabase.from('customers').update(payload).eq('id', editingId);
      if (error) { toast.error('Fout bij opslaan'); return; }
      toast.success('Klant bijgewerkt');
    } else {
      const { error } = await supabase.from('customers').insert(payload);
      if (error) { toast.error('Fout bij aanmaken'); return; }
      toast.success('Klant aangemaakt');
    }
    setShowDialog(false);
    setEditingId(null);
    setForm(emptyForm);
    loadCustomers();
  };

  const handleEdit = (c: Customer) => {
    setEditingId(c.id);
    setForm({
      name: c.name, company_name: c.company_name || '', email: c.email || '',
      phone: c.phone || '', vat_number: c.vat_number || '', address: c.address || '',
      city: c.city || '', postal_code: c.postal_code || '', country: c.country || 'NL',
      notes: c.notes || ''
    });
    setShowDialog(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('customers').delete().eq('id', deleteId);
    if (error) { toast.error('Fout bij verwijderen'); return; }
    toast.success('Klant verwijderd');
    setDeleteId(null);
    loadCustomers();
  };

  const filtered = customers.filter(c => {
    const term = searchTerm.toLowerCase();
    return c.name.toLowerCase().includes(term) || 
           (c.company_name || '').toLowerCase().includes(term) ||
           (c.email || '').toLowerCase().includes(term);
  });

  return (
    <div className="flex min-h-screen bg-background">
      <div className="flex-1 p-4 md:p-8 overflow-auto">
        <AdminBreadcrumb currentPage="Klanten" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Klanten</h1>
            <p className="text-muted-foreground">Beheer je klanten en relaties</p>
          </div>
          <Button onClick={() => { setEditingId(null); setForm(emptyForm); setShowDialog(true); }}>
            <Plus className="h-4 w-4 mr-2" /> Nieuwe Klant
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{customers.length}</p>
                  <p className="text-sm text-muted-foreground">Totaal klanten</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{Object.values(stats).reduce((a, s) => a + s.invoiceCount, 0)}</p>
                  <p className="text-sm text-muted-foreground">Totaal facturen</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Receipt className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">€{Object.values(stats).reduce((a, s) => a + s.totalInvoiced, 0).toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">Totaal gefactureerd</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Zoek klanten..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Naam</TableHead>
                  <TableHead className="hidden md:table-cell">Bedrijf</TableHead>
                  <TableHead className="hidden md:table-cell">Email</TableHead>
                  <TableHead className="hidden md:table-cell">Facturen</TableHead>
                  <TableHead className="hidden md:table-cell">Offertes</TableHead>
                  <TableHead>Acties</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Laden...</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Geen klanten gevonden</TableCell></TableRow>
                ) : filtered.map(c => (
                  <TableRow key={c.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setDetailCustomer(c)}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="hidden md:table-cell">{c.company_name || '-'}</TableCell>
                    <TableCell className="hidden md:table-cell">{c.email || '-'}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="secondary">{stats[c.id]?.invoiceCount || 0}</Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="secondary">{stats[c.id]?.quoteCount || 0}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(c)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteId(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* New/Edit Dialog */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Klant Bewerken' : 'Nieuwe Klant'}</DialogTitle>
              <DialogDescription>Vul de klantgegevens in</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Naam *</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
                <div><Label>Bedrijfsnaam</Label><Input value={form.company_name} onChange={e => setForm({...form, company_name: e.target.value})} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></div>
                <div><Label>Telefoon</Label><Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div>
              </div>
              <div><Label>BTW-nummer</Label><Input value={form.vat_number} onChange={e => setForm({...form, vat_number: e.target.value})} /></div>
              <div><Label>Adres</Label><Input value={form.address} onChange={e => setForm({...form, address: e.target.value})} /></div>
              <div className="grid grid-cols-3 gap-4">
                <div><Label>Postcode</Label><Input value={form.postal_code} onChange={e => setForm({...form, postal_code: e.target.value})} /></div>
                <div><Label>Stad</Label><Input value={form.city} onChange={e => setForm({...form, city: e.target.value})} /></div>
                <div><Label>Land</Label><Input value={form.country} onChange={e => setForm({...form, country: e.target.value})} /></div>
              </div>
              <div><Label>Notities</Label><Textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={3} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDialog(false)}>Annuleren</Button>
              <Button onClick={handleSave}>{editingId ? 'Opslaan' : 'Aanmaken'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Detail Dialog */}
        <Dialog open={!!detailCustomer} onOpenChange={() => setDetailCustomer(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{detailCustomer?.name}</DialogTitle>
              <DialogDescription>{detailCustomer?.company_name || 'Particulier'}</DialogDescription>
            </DialogHeader>
            {detailCustomer && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {detailCustomer.email && <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" />{detailCustomer.email}</div>}
                  {detailCustomer.phone && <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" />{detailCustomer.phone}</div>}
                  {detailCustomer.vat_number && <div className="flex items-center gap-2"><Building className="h-4 w-4 text-muted-foreground" />{detailCustomer.vat_number}</div>}
                </div>
                {(detailCustomer.address || detailCustomer.city) && (
                  <p className="text-sm text-muted-foreground">
                    {[detailCustomer.address, detailCustomer.postal_code, detailCustomer.city, detailCustomer.country].filter(Boolean).join(', ')}
                  </p>
                )}
                <div className="flex gap-4">
                  <div className="flex-1 bg-muted rounded-lg p-3 text-center">
                    <p className="text-lg font-bold">{stats[detailCustomer.id]?.invoiceCount || 0}</p>
                    <p className="text-xs text-muted-foreground">Facturen</p>
                  </div>
                  <div className="flex-1 bg-muted rounded-lg p-3 text-center">
                    <p className="text-lg font-bold">{stats[detailCustomer.id]?.quoteCount || 0}</p>
                    <p className="text-xs text-muted-foreground">Offertes</p>
                  </div>
                  <div className="flex-1 bg-muted rounded-lg p-3 text-center">
                    <p className="text-lg font-bold">€{(stats[detailCustomer.id]?.totalInvoiced || 0).toFixed(0)}</p>
                    <p className="text-xs text-muted-foreground">Gefactureerd</p>
                  </div>
                </div>
                {detailCustomer.notes && <p className="text-sm text-muted-foreground bg-muted rounded-lg p-3">{detailCustomer.notes}</p>}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Klant verwijderen</AlertDialogTitle>
              <AlertDialogDescription>Weet je zeker dat je deze klant wilt verwijderen? Facturen en offertes blijven behouden.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuleren</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>Verwijderen</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
