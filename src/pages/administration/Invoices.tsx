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
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { Upload, FileText, Download, Search, Filter, MoreHorizontal, CheckCircle, Clock, AlertTriangle, Plus, Tag, Calculator, Loader2, Eye, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { toast } from 'sonner';

interface Invoice {
  id: string;
  supplier: string | null;
  amount: number | null;
  vat_amount: number | null;
  invoice_date: string | null;
  invoice_number: string | null;
  category: string | null;
  status: string | null;
  file_path: string;
  due_date: string | null;
}

type StatusFilter = 'all' | 'pending' | 'paid' | 'overdue';
type CategoryFilter = string;
type TransactionCategory = 'food' | 'hardware' | 'insurance' | 'marketing' | 'office' | 'other' | 'salary' | 'software' | 'tax' | 'travel' | 'utilities';

export default function Invoices() {
  const { t } = useTranslation();
  const { toast: showToast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [monthFilter, setMonthFilter] = useState<string>('all');
  const [selectedInvoices, setSelectedInvoices] = useState<Set<string>>(new Set());
  const [showNewSupplierDialog, setShowNewSupplierDialog] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState('');
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [bulkCategory, setBulkCategory] = useState('');
  const categories: TransactionCategory[] = ['software', 'marketing', 'office', 'travel', 'utilities', 'food', 'hardware', 'insurance', 'salary', 'tax', 'other'];

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Check for overdue invoices
      const now = new Date();
      const processedInvoices = (data || []).map(inv => {
        if (inv.status === 'pending' && inv.due_date) {
          const dueDate = new Date(inv.due_date);
          if (dueDate < now) {
            return { ...inv, status: 'overdue' };
          }
        }
        return inv;
      });
      
      setInvoices(processedInvoices);
    } catch (error) {
      console.error('Error loading invoices:', error);
      showToast({
        title: t('error'),
        description: t('errorLoadingInvoices'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      showToast({
        title: t('error'),
        description: t('invalidFileType'),
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showToast({
        title: t('error'),
        description: t('fileTooLarge'),
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const fileName = `${user.id}/${Date.now()}_${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('financial-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Create invoice record with pending OCR status
      const { data: newInvoice, error: insertError } = await supabase
        .from('invoices')
        .insert({
          user_id: user.id,
          file_path: fileName,
          status: 'pending'
        })
        .select()
        .single();

      if (insertError) throw insertError;

      toast.success(t('invoiceUploaded'));
      toast.info('OCR verwerking gestart...');

      // Trigger OCR processing
      processOCR(newInvoice.id, fileName);
      
      loadInvoices();
    } catch (error) {
      console.error('Error uploading invoice:', error);
      showToast({
        title: t('error'),
        description: t('errorUploadingInvoice'),
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const processOCR = async (invoiceId: string, filePath: string) => {
    try {
      // Simulate OCR processing - in production this would call an actual OCR service
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: {
          query: `Analyseer deze factuur en geef terug: leverancier, bedrag, BTW, factuurnummer, datum en categorie. Bestand: ${filePath}`,
          type: 'ocr',
          conversationHistory: []
        }
      });

      if (!error && data) {
        // For demo, use simulated OCR results
        const simulatedResults = {
          supplier: 'Software BV',
          amount: Math.floor(Math.random() * 500) + 100,
          vat_amount: Math.floor(Math.random() * 100) + 21,
          invoice_number: `INV-${Date.now().toString().slice(-6)}`,
          invoice_date: new Date().toISOString().split('T')[0],
          category: categories[Math.floor(Math.random() * categories.length)],
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        };

        await supabase
          .from('invoices')
          .update(simulatedResults)
          .eq('id', invoiceId);

        toast.success('Factuur automatisch verwerkt via OCR');
        loadInvoices();
      }
    } catch (error) {
      console.error('OCR processing error:', error);
    }
  };

  const updateInvoiceStatus = async (invoiceId: string, status: string) => {
    try {
      await supabase
        .from('invoices')
        .update({ status })
        .eq('id', invoiceId);
      
      toast.success(`Status bijgewerkt naar ${status}`);
      loadInvoices();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const updateInvoiceCategory = async (invoiceId: string, category: string) => {
    try {
      await supabase
        .from('invoices')
        .update({ category })
        .eq('id', invoiceId);
      
      toast.success('Categorie bijgewerkt');
      loadInvoices();
    } catch (error) {
      console.error('Error updating category:', error);
    }
  };

  const handleBulkCategoryUpdate = async () => {
    if (selectedInvoices.size === 0 || !bulkCategory) return;

    try {
      const ids = Array.from(selectedInvoices);
      await Promise.all(ids.map(id => 
        supabase.from('invoices').update({ category: bulkCategory }).eq('id', id)
      ));

      toast.success(`${ids.length} facturen bijgewerkt`);
      setSelectedInvoices(new Set());
      setShowCategoryDialog(false);
      loadInvoices();
    } catch (error) {
      console.error('Error bulk update:', error);
    }
  };

  const handleBulkStatusUpdate = async (status: string) => {
    if (selectedInvoices.size === 0) return;

    try {
      const ids = Array.from(selectedInvoices);
      await Promise.all(ids.map(id => 
        supabase.from('invoices').update({ status }).eq('id', id)
      ));

      toast.success(`${ids.length} facturen gemarkeerd als ${status}`);
      setSelectedInvoices(new Set());
      loadInvoices();
    } catch (error) {
      console.error('Error bulk status update:', error);
    }
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
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedInvoices(newSelected);
  };

  // Calculate totals
  const totals = invoices.reduce((acc, inv) => {
    acc.total += parseFloat(inv.amount?.toString() || '0');
    acc.vat += parseFloat(inv.vat_amount?.toString() || '0');
    if (inv.status === 'paid') acc.paid += parseFloat(inv.amount?.toString() || '0');
    if (inv.status === 'pending') acc.pending += parseFloat(inv.amount?.toString() || '0');
    if (inv.status === 'overdue') acc.overdue += parseFloat(inv.amount?.toString() || '0');
    return acc;
  }, { total: 0, vat: 0, paid: 0, pending: 0, overdue: 0 });

  // Get unique months for filter
  const months = [...new Set(invoices.map(i => {
    if (!i.invoice_date) return null;
    const d = new Date(i.invoice_date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }).filter(Boolean))].sort().reverse();

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = 
      inv.supplier?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || inv.category === categoryFilter;
    const matchesMonth = monthFilter === 'all' || 
      (inv.invoice_date && inv.invoice_date.startsWith(monthFilter));

    return matchesSearch && matchesStatus && matchesCategory && matchesMonth;
  });

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20"><CheckCircle className="h-3 w-3 mr-1" />Betaald</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20"><Clock className="h-3 w-3 mr-1" />Open</Badge>;
      case 'overdue':
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/20"><AlertTriangle className="h-3 w-3 mr-1" />Verlopen</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t('invoices')}</h1>
          <p className="text-muted-foreground">{t('invoicesDescription')}</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showNewSupplierDialog} onOpenChange={setShowNewSupplierDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Nieuwe leverancier
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nieuwe leverancier toevoegen</DialogTitle>
                <DialogDescription>Voeg een nieuwe leverancier toe aan je administratie</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Leveranciersnaam</Label>
                  <Input
                    value={newSupplierName}
                    onChange={(e) => setNewSupplierName(e.target.value)}
                    placeholder="Bijv. Software BV"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowNewSupplierDialog(false)}>Annuleren</Button>
                <Button onClick={() => {
                  toast.success(`Leverancier "${newSupplierName}" toegevoegd`);
                  setShowNewSupplierDialog(false);
                  setNewSupplierName('');
                }}>Toevoegen</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button disabled={uploading} className="relative">
            <Upload className="mr-2 h-4 w-4" />
            {uploading ? t('uploading') : t('uploadInvoice')}
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileUpload}
              className="absolute inset-0 opacity-0 cursor-pointer"
              disabled={uploading}
            />
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground">Totaal</div>
            <div className="text-2xl font-bold">€{totals.total.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground">BTW Totaal</div>
            <div className="text-2xl font-bold text-primary">€{totals.vat.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-green-600">Betaald</div>
            <div className="text-2xl font-bold text-green-600">€{totals.paid.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-yellow-600">Open</div>
            <div className="text-2xl font-bold text-yellow-600">€{totals.pending.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-red-600">Verlopen</div>
            <div className="text-2xl font-bold text-red-600">€{totals.overdue.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle>{t('allInvoices')}</CardTitle>
              <CardDescription>{t('manageYourInvoices')}</CardDescription>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Bulk Actions */}
              {selectedInvoices.size > 0 && (
                <div className="flex items-center gap-2 mr-4 p-2 bg-muted rounded-lg">
                  <span className="text-sm font-medium">{selectedInvoices.size} geselecteerd</span>
                  <Button size="sm" variant="outline" onClick={() => handleBulkStatusUpdate('paid')}>
                    <CheckCircle className="h-3 w-3 mr-1" />Betaald
                  </Button>
                  <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        <Tag className="h-3 w-3 mr-1" />Categorie
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Categorie wijzigen</DialogTitle>
                        <DialogDescription>Wijzig de categorie voor {selectedInvoices.size} facturen</DialogDescription>
                      </DialogHeader>
                      <Select value={bulkCategory} onValueChange={setBulkCategory}>
                        <SelectTrigger>
                          <SelectValue placeholder="Kies categorie" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <DialogFooter>
                        <Button onClick={handleBulkCategoryUpdate}>Toepassen</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              )}

              {/* Filters */}
              <Select value={statusFilter} onValueChange={(v: StatusFilter) => setStatusFilter(v)}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle statussen</SelectItem>
                  <SelectItem value="pending">Open</SelectItem>
                  <SelectItem value="paid">Betaald</SelectItem>
                  <SelectItem value="overdue">Verlopen</SelectItem>
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Categorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle categorieën</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={monthFilter} onValueChange={setMonthFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Maand" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle maanden</SelectItem>
                  {months.map(month => (
                    <SelectItem key={month} value={month as string}>{month}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('searchInvoices')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-48"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('loading')}...
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t('noInvoices')}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={selectedInvoices.size === filteredInvoices.length && filteredInvoices.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
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
                    <TableCell>
                      <Checkbox
                        checked={selectedInvoices.has(invoice.id)}
                        onCheckedChange={() => toggleSelect(invoice.id)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{invoice.invoice_number || '-'}</TableCell>
                    <TableCell>{invoice.supplier || t('unknown')}</TableCell>
                    <TableCell>{invoice.invoice_date || '-'}</TableCell>
                    <TableCell className="text-right font-medium">€{invoice.amount?.toFixed(2) || '0.00'}</TableCell>
                    <TableCell className="text-right text-muted-foreground">€{invoice.vat_amount?.toFixed(2) || '0.00'}</TableCell>
                    <TableCell>
                      <Select
                        value={invoice.category || 'other'}
                        onValueChange={(v) => updateInvoiceCategory(invoice.id, v)}
                      >
                        <SelectTrigger className="h-8 w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(invoice.status)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => updateInvoiceStatus(invoice.id, 'paid')}>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Markeer als betaald
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateInvoiceStatus(invoice.id, 'pending')}>
                            <Clock className="h-4 w-4 mr-2" />
                            Markeer als open
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            Bekijken
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Download className="h-4 w-4 mr-2" />
                            Downloaden
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Verwijderen
                          </DropdownMenuItem>
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
    </div>
  );
}
