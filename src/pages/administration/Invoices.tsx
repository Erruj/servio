import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { Upload, FileText, Download, Search, MoreHorizontal, CheckCircle, Clock, AlertTriangle, Plus, Tag, Loader2, Eye, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { toast } from 'sonner';
import { AdminBreadcrumb } from '@/components/AdminBreadcrumb';

interface Invoice {
  id: string;
  supplier: string | null;
  supplier_id: string | null;
  amount: number | null;
  vat_amount: number | null;
  invoice_date: string | null;
  invoice_number: string | null;
  category: string | null;
  status: string | null;
  file_path: string;
  due_date: string | null;
}

interface Supplier {
  id: string;
  name: string;
  vat_number: string | null;
  email: string | null;
  iban: string | null;
}

type StatusFilter = 'all' | 'pending' | 'paid' | 'overdue';
type TransactionCategory = 'food' | 'hardware' | 'insurance' | 'marketing' | 'office' | 'other' | 'salary' | 'software' | 'tax' | 'travel' | 'utilities';

export default function Invoices() {
  const { t } = useTranslation();
  const { toast: showToast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [supplierFilter, setSupplierFilter] = useState<string>('all');
  const [monthFilter, setMonthFilter] = useState<string>('all');
  const [selectedInvoices, setSelectedInvoices] = useState<Set<string>>(new Set());
  const [showNewSupplierDialog, setShowNewSupplierDialog] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState('');
  const [newSupplierVat, setNewSupplierVat] = useState('');
  const [newSupplierEmail, setNewSupplierEmail] = useState('');
  const [newSupplierIban, setNewSupplierIban] = useState('');
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [bulkCategory, setBulkCategory] = useState<TransactionCategory | ''>('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const categories: TransactionCategory[] = ['software', 'marketing', 'office', 'travel', 'utilities', 'food', 'hardware', 'insurance', 'salary', 'tax', 'other'];

  useEffect(() => {
    loadInvoices();
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    const { data } = await supabase.from('suppliers').select('*').order('name');
    setSuppliers((data as any[]) || []);
  };

  const loadInvoices = async () => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      const now = new Date();
      const processedInvoices = (data || []).map(inv => {
        if (inv.status === 'pending' && inv.due_date) {
          const dueDate = new Date(inv.due_date);
          if (dueDate < now) return { ...inv, status: 'overdue' };
        }
        return inv;
      });
      setInvoices(processedInvoices as Invoice[]);
    } catch (error) {
      console.error('Error loading invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    // reset input so same file can be re-selected
    event.target.value = '';

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      showToast({ title: 'Fout', description: 'Alleen PDF, JPG en PNG bestanden zijn toegestaan.', variant: 'destructive' });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showToast({ title: 'Fout', description: 'Bestand is te groot (max 10MB).', variant: 'destructive' });
      return;
    }

    setUploading(true);
    let uploadedPath: string | null = null;
    let createdInvoiceId: string | null = null;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Niet ingelogd');

      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const fileName = `${user.id}/${Date.now()}_${safeName}`;

      // 1. Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('financial-documents')
        .upload(fileName, file, { contentType: file.type, upsert: false });
      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw new Error(`Upload mislukt: ${uploadError.message}`);
      }
      uploadedPath = fileName;

      // 2. Verify the file actually exists in storage
      const folder = fileName.substring(0, fileName.lastIndexOf('/'));
      const baseName = fileName.substring(fileName.lastIndexOf('/') + 1);
      const { data: listed, error: listErr } = await supabase.storage
        .from('financial-documents')
        .list(folder, { search: baseName, limit: 1 });
      if (listErr || !listed || listed.length === 0) {
        throw new Error('Bestand kon niet worden geverifieerd in opslag');
      }

      // 3. Insert DB record with file_path
      const { data: newInvoice, error: insertError } = await supabase
        .from('invoices')
        .insert({ user_id: user.id, file_path: fileName, status: 'analyzing' })
        .select()
        .single();
      if (insertError || !newInvoice) {
        throw new Error(`Database insert mislukt: ${insertError?.message || 'onbekende fout'}`);
      }
      createdInvoiceId = newInvoice.id;

      toast.success('Factuur geüpload, AI-analyse gestart...');
      loadInvoices();

      // 4. Trigger AI analysis (fire-and-forget but tracked)
      analyzeInvoice(newInvoice.id, fileName);
    } catch (error) {
      console.error('Error uploading invoice:', error);
      // Cleanup on partial failure
      if (uploadedPath && !createdInvoiceId) {
        await supabase.storage.from('financial-documents').remove([uploadedPath]).catch(() => {});
      }
      const msg = error instanceof Error ? error.message : 'Factuur kon niet worden geüpload.';
      showToast({ title: 'Upload mislukt', description: msg, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const analyzeInvoice = async (invoiceId: string, filePath: string) => {
    setAnalyzingId(invoiceId);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-invoice', {
        body: { invoiceId, filePath },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success('Factuur geanalyseerd');
    } catch (error) {
      console.error('AI analyse error:', error);
      const msg = error instanceof Error ? error.message : 'AI analyse mislukt';
      toast.error(`AI analyse mislukt: ${msg}`);
    } finally {
      setAnalyzingId(null);
      loadInvoices();
    }
  };

  const updateInvoiceStatus = async (invoiceId: string, status: string) => {
    await supabase.from('invoices').update({ status }).eq('id', invoiceId);
    toast.success(`Status bijgewerkt naar ${status}`);
    loadInvoices();
  };

  const updateInvoiceCategory = async (invoiceId: string, category: TransactionCategory) => {
    await supabase.from('invoices').update({ category }).eq('id', invoiceId);
    toast.success('Categorie bijgewerkt');
    loadInvoices();
  };

  const handleAddSupplier = async () => {
    if (!newSupplierName.trim()) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await supabase.from('suppliers').insert({
        user_id: user.id,
        name: newSupplierName,
        vat_number: newSupplierVat || null,
        email: newSupplierEmail || null,
        iban: newSupplierIban || null,
      } as any);
      if (error) throw error;
      toast.success(`Leverancier "${newSupplierName}" toegevoegd`);
      setShowNewSupplierDialog(false);
      setNewSupplierName('');
      setNewSupplierVat('');
      setNewSupplierEmail('');
      setNewSupplierIban('');
      loadSuppliers();
    } catch (error) {
      console.error('Error adding supplier:', error);
      toast.error('Leverancier kon niet worden toegevoegd');
    }
  };

  const handleDeleteInvoice = async () => {
    if (!deleteId) return;
    setActionLoading(deleteId);
    try {
      const invoice = invoices.find(i => i.id === deleteId);
      if (invoice?.file_path) {
        await supabase.storage.from('financial-documents').remove([invoice.file_path]);
      }
      await supabase.from('invoices').delete().eq('id', deleteId);
      toast.success('Factuur verwijderd');
      setDeleteId(null);
      loadInvoices();
    } catch (error) {
      console.error('Error deleting invoice:', error);
      toast.error('Factuur kon niet worden verwijderd');
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewInvoice = async (invoice: Invoice) => {
    setActionLoading(invoice.id);
    try {
      const { data, error } = await supabase.storage
        .from('financial-documents')
        .createSignedUrl(invoice.file_path, 3600);
      if (error || !data?.signedUrl) {
        toast.error('Bestand kon niet worden geopend');
        return;
      }
      const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(invoice.file_path);
      if (isImage) {
        // Show image in modal
        setPreviewUrl(data.signedUrl);
      } else {
        // Open PDF (or other) in new tab — avoids iframe content blocking
        window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (error) {
      console.error('Error viewing invoice:', error);
      toast.error('Bestand kon niet worden geopend');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDownloadInvoice = async (invoice: Invoice) => {
    setActionLoading(invoice.id);
    try {
      const { data } = await supabase.storage.from('financial-documents').createSignedUrl(invoice.file_path, 3600);
      if (data?.signedUrl) {
        const a = document.createElement('a');
        a.href = data.signedUrl;
        a.download = invoice.file_path.split('/').pop() || 'factuur';
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        toast.success('Download gestart');
      } else {
        toast.error('Bestand kon niet worden gedownload');
      }
    } catch (error) {
      console.error('Error downloading invoice:', error);
      toast.error('Download mislukt');
    } finally {
      setActionLoading(null);
    }
  };

  const handleBulkCategoryUpdate = async () => {
    if (selectedInvoices.size === 0 || !bulkCategory) return;
    const ids = Array.from(selectedInvoices);
    await Promise.all(ids.map(id => supabase.from('invoices').update({ category: bulkCategory }).eq('id', id)));
    toast.success(`${ids.length} facturen bijgewerkt`);
    setSelectedInvoices(new Set());
    setShowCategoryDialog(false);
    loadInvoices();
  };

  const handleBulkStatusUpdate = async (status: string) => {
    if (selectedInvoices.size === 0) return;
    const ids = Array.from(selectedInvoices);
    await Promise.all(ids.map(id => supabase.from('invoices').update({ status }).eq('id', id)));
    toast.success(`${ids.length} facturen gemarkeerd als ${status}`);
    setSelectedInvoices(new Set());
    loadInvoices();
  };

  const toggleSelectAll = () => {
    if (selectedInvoices.size === filteredInvoices.length) {
      setSelectedInvoices(new Set());
    } else {
      setSelectedInvoices(new Set(filteredInvoices.map(i => i.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedInvoices);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedInvoices(newSelected);
  };

  const totals = invoices.reduce((acc, inv) => {
    acc.total += parseFloat(inv.amount?.toString() || '0');
    acc.vat += parseFloat(inv.vat_amount?.toString() || '0');
    if (inv.status === 'paid') acc.paid += parseFloat(inv.amount?.toString() || '0');
    if (inv.status === 'pending') acc.pending += parseFloat(inv.amount?.toString() || '0');
    if (inv.status === 'overdue') acc.overdue += parseFloat(inv.amount?.toString() || '0');
    return acc;
  }, { total: 0, vat: 0, paid: 0, pending: 0, overdue: 0 });

  const months = [...new Set(invoices.map(i => {
    if (!i.invoice_date) return null;
    const d = new Date(i.invoice_date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }).filter(Boolean))].sort().reverse();

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = inv.supplier?.toLowerCase().includes(searchTerm.toLowerCase()) || inv.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || inv.category === categoryFilter;
    const matchesSupplier = supplierFilter === 'all' || inv.supplier === supplierFilter;
    const matchesMonth = monthFilter === 'all' || (inv.invoice_date && inv.invoice_date.startsWith(monthFilter));
    return matchesSearch && matchesStatus && matchesCategory && matchesSupplier && matchesMonth;
  });

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'paid': return <Badge className="bg-green-500/10 text-green-600 border-green-500/20"><CheckCircle className="h-3 w-3 mr-1" />Betaald</Badge>;
      case 'pending': return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20"><Clock className="h-3 w-3 mr-1" />Open</Badge>;
      case 'overdue': return <Badge className="bg-red-500/10 text-red-600 border-red-500/20"><AlertTriangle className="h-3 w-3 mr-1" />Verlopen</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const uniqueSuppliers = [...new Set(invoices.map(i => i.supplier).filter(Boolean))];

  return (
    <div className="space-y-6 p-6">
      <AdminBreadcrumb currentPage="Facturen" />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t('invoices')}</h1>
          <p className="text-muted-foreground">{t('invoicesDescription')}</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showNewSupplierDialog} onOpenChange={setShowNewSupplierDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm"><Plus className="mr-2 h-4 w-4" />Nieuwe leverancier</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nieuwe leverancier toevoegen</DialogTitle>
                <DialogDescription>Voeg een nieuwe leverancier toe aan je administratie</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2"><Label>Leveranciersnaam *</Label><Input value={newSupplierName} onChange={(e) => setNewSupplierName(e.target.value)} placeholder="Bijv. Software BV" /></div>
                <div className="space-y-2"><Label>BTW-nummer</Label><Input value={newSupplierVat} onChange={(e) => setNewSupplierVat(e.target.value)} placeholder="NL123456789B01" /></div>
                <div className="space-y-2"><Label>E-mailadres</Label><Input type="email" value={newSupplierEmail} onChange={(e) => setNewSupplierEmail(e.target.value)} placeholder="info@leverancier.nl" /></div>
                <div className="space-y-2"><Label>IBAN</Label><Input value={newSupplierIban} onChange={(e) => setNewSupplierIban(e.target.value)} placeholder="NL00BANK0123456789" /></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowNewSupplierDialog(false)}>Annuleren</Button>
                <Button onClick={handleAddSupplier} disabled={!newSupplierName.trim()}>Toevoegen</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button disabled={uploading} className="relative">
            <Upload className="mr-2 h-4 w-4" />
            {uploading ? 'Uploaden...' : t('uploadInvoice')}
            <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" disabled={uploading} />
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card><CardContent className="pt-4"><div className="text-sm text-muted-foreground">Totaal</div><div className="text-2xl font-bold">€{totals.total.toLocaleString()}</div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="text-sm text-muted-foreground">BTW Totaal</div><div className="text-2xl font-bold text-primary">€{totals.vat.toLocaleString()}</div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="text-sm text-green-600">Betaald</div><div className="text-2xl font-bold text-green-600">€{totals.paid.toLocaleString()}</div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="text-sm text-yellow-600">Open</div><div className="text-2xl font-bold text-yellow-600">€{totals.pending.toLocaleString()}</div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="text-sm text-red-600">Verlopen</div><div className="text-2xl font-bold text-red-600">€{totals.overdue.toLocaleString()}</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div><CardTitle>{t('allInvoices')}</CardTitle><CardDescription>{t('manageYourInvoices')}</CardDescription></div>
            <div className="flex items-center gap-2 flex-wrap">
              {selectedInvoices.size > 0 && (
                <div className="flex items-center gap-2 mr-4 p-2 bg-muted rounded-lg">
                  <span className="text-sm font-medium">{selectedInvoices.size} geselecteerd</span>
                  <Button size="sm" variant="outline" onClick={() => handleBulkStatusUpdate('paid')}><CheckCircle className="h-3 w-3 mr-1" />Betaald</Button>
                  <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
                    <DialogTrigger asChild><Button size="sm" variant="outline"><Tag className="h-3 w-3 mr-1" />Categorie</Button></DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Categorie wijzigen</DialogTitle><DialogDescription>Wijzig de categorie voor {selectedInvoices.size} facturen</DialogDescription></DialogHeader>
                      <Select value={bulkCategory} onValueChange={(v) => setBulkCategory(v as TransactionCategory)}>
                        <SelectTrigger><SelectValue placeholder="Kies categorie" /></SelectTrigger>
                        <SelectContent>{categories.map(cat => (<SelectItem key={cat} value={cat}>{cat}</SelectItem>))}</SelectContent>
                      </Select>
                      <DialogFooter><Button onClick={handleBulkCategoryUpdate}>Toepassen</Button></DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              )}

              <Select value={statusFilter} onValueChange={(v: StatusFilter) => setStatusFilter(v)}>
                <SelectTrigger className="w-32"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle statussen</SelectItem>
                  <SelectItem value="pending">Open</SelectItem>
                  <SelectItem value="paid">Betaald</SelectItem>
                  <SelectItem value="overdue">Verlopen</SelectItem>
                </SelectContent>
              </Select>

              <Select value={supplierFilter} onValueChange={setSupplierFilter}>
                <SelectTrigger className="w-36"><SelectValue placeholder="Leverancier" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle leveranciers</SelectItem>
                  {uniqueSuppliers.map(s => (<SelectItem key={s!} value={s!}>{s}</SelectItem>))}
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-32"><SelectValue placeholder="Categorie" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle categorieën</SelectItem>
                  {categories.map(cat => (<SelectItem key={cat} value={cat}>{cat}</SelectItem>))}
                </SelectContent>
              </Select>

              <Select value={monthFilter} onValueChange={setMonthFilter}>
                <SelectTrigger className="w-32"><SelectValue placeholder="Maand" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle maanden</SelectItem>
                  {months.map(month => (<SelectItem key={month} value={month as string}>{month}</SelectItem>))}
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input placeholder="Zoek facturen..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-48" />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Laden...</div>
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Nog geen facturen</h3>
              <p className="max-w-sm mx-auto">Upload je eerste factuur om te beginnen.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"><Checkbox checked={selectedInvoices.size === filteredInvoices.length && filteredInvoices.length > 0} onCheckedChange={toggleSelectAll} /></TableHead>
                  <TableHead>{t('invoiceNumber')}</TableHead>
                  <TableHead>{t('supplier')}</TableHead>
                  <TableHead>{t('date')}</TableHead>
                  <TableHead className="text-right">{t('amount')}</TableHead>
                  <TableHead className="text-right">BTW</TableHead>
                  <TableHead>{t('category')}</TableHead>
                  <TableHead>{t('status')}</TableHead>
                  <TableHead className="w-10">{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id} className={selectedInvoices.has(invoice.id) ? 'bg-muted/50' : ''}>
                    <TableCell><Checkbox checked={selectedInvoices.has(invoice.id)} onCheckedChange={() => toggleSelect(invoice.id)} /></TableCell>
                    <TableCell className="font-medium">{invoice.invoice_number || '-'}</TableCell>
                    <TableCell>{invoice.supplier || t('unknown')}</TableCell>
                    <TableCell>{invoice.invoice_date || '-'}</TableCell>
                    <TableCell className="text-right font-medium">€{invoice.amount?.toFixed(2) || '0.00'}</TableCell>
                    <TableCell className="text-right text-muted-foreground">€{invoice.vat_amount?.toFixed(2) || '0.00'}</TableCell>
                    <TableCell>
                      <Select value={invoice.category || 'other'} onValueChange={(v) => updateInvoiceCategory(invoice.id, v as TransactionCategory)}>
                        <SelectTrigger className="h-8 w-28"><SelectValue /></SelectTrigger>
                        <SelectContent>{categories.map(cat => (<SelectItem key={cat} value={cat}>{cat}</SelectItem>))}</SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" disabled={actionLoading === invoice.id}>
                            {actionLoading === invoice.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => updateInvoiceStatus(invoice.id, 'paid')}><CheckCircle className="h-4 w-4 mr-2" />Markeer als betaald</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateInvoiceStatus(invoice.id, 'pending')}><Clock className="h-4 w-4 mr-2" />Markeer als open</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleViewInvoice(invoice)}><Eye className="h-4 w-4 mr-2" />Bekijken</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDownloadInvoice(invoice)}><Download className="h-4 w-4 mr-2" />Downloaden</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(invoice.id)}><Trash2 className="h-4 w-4 mr-2" />Verwijderen</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Weet je zeker dat je deze factuur wilt verwijderen?</AlertDialogTitle>
            <AlertDialogDescription>Deze actie kan niet ongedaan worden gemaakt. De factuur en het bijbehorende bestand worden permanent verwijderd.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteInvoice} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Verwijderen</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Preview modal */}
      <Dialog open={!!previewUrl} onOpenChange={(open) => !open && setPreviewUrl(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader><DialogTitle>Factuur bekijken</DialogTitle></DialogHeader>
          {previewUrl && (
            <img src={previewUrl} alt="Factuur" className="w-full max-h-[70vh] object-contain" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
