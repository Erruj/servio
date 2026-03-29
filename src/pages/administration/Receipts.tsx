import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Upload, Receipt as ReceiptIcon, Camera } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Receipt {
  id: string;
  merchant: string | null;
  amount: number | null;
  category: string | null;
  receipt_date: string | null;
  status: string | null;
  file_path: string;
  created_at: string;
}

export default function Receipts() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadReceipts();
  }, []);

  const loadReceipts = async () => {
    try {
      const { data, error } = await supabase
        .from('receipts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReceipts(data || []);
    } catch (error) {
      console.error('Error loading receipts:', error);
      toast({
        title: t('error'),
        description: t('errorLoadingReceipts'),
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
    const allowedTypes = ['image/jpeg', 'image/png', 'image/heic'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: t('error'),
        description: t('invalidFileType'),
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
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

      // Create receipt record (AI OCR would happen here in production)
      const { error: insertError } = await supabase
        .from('receipts')
        .insert({
          user_id: user.id,
          file_path: fileName,
          status: 'uploaded'
        });

      if (insertError) throw insertError;

      toast({
        title: t('success'),
        description: t('receiptUploaded'),
      });

      loadReceipts();
    } catch (error) {
      console.error('Error uploading receipt:', error);
      toast({
        title: t('error'),
        description: t('errorUploadingReceipt'),
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'needs_review':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t('receipts')}</h1>
          <p className="text-muted-foreground">{t('receiptsDescription')}</p>
        </div>
        <div className="flex gap-2">
          <Button disabled={uploading} className="relative">
            <Camera className="mr-2 h-4 w-4" />
            {uploading ? t('uploading') : t('uploadReceipt')}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileUpload}
              className="absolute inset-0 opacity-0 cursor-pointer"
              disabled={uploading}
            />
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('allReceipts')}</CardTitle>
          <CardDescription>{t('manageYourReceipts')}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">{t('loading')}...</div>
          ) : receipts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ReceiptIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Nog geen bonnetjes</h3>
              <p className="max-w-sm mx-auto">Upload of fotografeer je eerste bonnetje. Servio leest het bedrag, de winkel en de categorie automatisch uit.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {receipts.map((receipt) => (
                <Card key={receipt.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-foreground">
                          {receipt.merchant || t('unknownMerchant')}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {receipt.receipt_date || new Date(receipt.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant={getStatusColor(receipt.status)}>
                        {receipt.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-2xl font-bold text-foreground">
                        €{receipt.amount?.toFixed(2) || '0.00'}
                      </p>
                      {receipt.category && (
                        <Badge variant="outline">{receipt.category}</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
