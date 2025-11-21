import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Upload, FileText, Download, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
}

export default function Invoices() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

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
      setInvoices(data || []);
    } catch (error) {
      console.error('Error loading invoices:', error);
      toast({
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

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: t('error'),
        description: t('invalidFileType'),
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
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

      // Create invoice record (AI processing would happen here in production)
      const { error: insertError } = await supabase
        .from('invoices')
        .insert({
          user_id: user.id,
          file_path: fileName,
          status: 'pending'
        });

      if (insertError) throw insertError;

      toast({
        title: t('success'),
        description: t('invoiceUploaded'),
      });

      loadInvoices();
    } catch (error) {
      console.error('Error uploading invoice:', error);
      toast({
        title: t('error'),
        description: t('errorUploadingInvoice'),
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const filteredInvoices = invoices.filter(inv => 
    inv.supplier?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t('invoices')}</h1>
          <p className="text-muted-foreground">{t('invoicesDescription')}</p>
        </div>
        <div>
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

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('allInvoices')}</CardTitle>
              <CardDescription>{t('manageYourInvoices')}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('searchInvoices')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">{t('loading')}...</div>
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t('noInvoices')}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('invoiceNumber')}</TableHead>
                  <TableHead>{t('supplier')}</TableHead>
                  <TableHead>{t('date')}</TableHead>
                  <TableHead>{t('amount')}</TableHead>
                  <TableHead>{t('category')}</TableHead>
                  <TableHead>{t('status')}</TableHead>
                  <TableHead>{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.invoice_number || '-'}</TableCell>
                    <TableCell>{invoice.supplier || t('unknown')}</TableCell>
                    <TableCell>{invoice.invoice_date || '-'}</TableCell>
                    <TableCell>€{invoice.amount?.toFixed(2) || '0.00'}</TableCell>
                    <TableCell>
                      {invoice.category ? (
                        <Badge variant="secondary">{invoice.category}</Badge>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={invoice.status === 'pending' ? 'outline' : 'default'}>
                        {invoice.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
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
