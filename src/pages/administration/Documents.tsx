import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Upload, FileText, Search, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Document {
  id: string;
  title: string;
  document_type: string;
  ai_summary: string | null;
  ai_key_points: any;
  ai_risks: any;
  status: string | null;
  file_path: string;
  created_at: string;
}

export default function Documents() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error loading documents:', error);
      toast({
        title: t('error'),
        description: t('errorLoadingDocuments'),
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
    if (file.type !== 'application/pdf') {
      toast({
        title: t('error'),
        description: t('onlyPdfAllowed'),
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 15MB)
    if (file.size > 15 * 1024 * 1024) {
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

      // Create document record (AI analysis would happen here in production)
      const { error: insertError } = await supabase
        .from('documents')
        .insert({
          user_id: user.id,
          file_path: fileName,
          title: file.name.replace('.pdf', ''),
          document_type: 'other',
          status: 'uploaded'
        });

      if (insertError) throw insertError;

      toast({
        title: t('success'),
        description: t('documentUploaded'),
      });

      loadDocuments();
    } catch (error) {
      console.error('Error uploading document:', error);
      toast({
        title: t('error'),
        description: t('errorUploadingDocument'),
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || doc.document_type === filterType;
    return matchesSearch && matchesFilter;
  });

  const getDocumentTypeColor = (type: string) => {
    switch (type) {
      case 'invoice':
        return 'default';
      case 'contract':
        return 'destructive';
      case 'offer':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t('documents')}</h1>
          <p className="text-muted-foreground">{t('documentsDescription')}</p>
        </div>
        <div>
          <Button disabled={uploading} className="relative">
            <Upload className="mr-2 h-4 w-4" />
            {uploading ? t('uploading') : t('uploadDocument')}
            <input
              type="file"
              accept=".pdf"
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
              <CardTitle>{t('allDocuments')}</CardTitle>
              <CardDescription>{t('manageYourDocuments')}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('all')}</SelectItem>
                  <SelectItem value="contract">{t('contracts')}</SelectItem>
                  <SelectItem value="offer">{t('offers')}</SelectItem>
                  <SelectItem value="invoice">{t('invoices')}</SelectItem>
                  <SelectItem value="other">{t('other')}</SelectItem>
                </SelectContent>
              </Select>
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('searchDocuments')}
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
          ) : filteredDocuments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t('noDocuments')}</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredDocuments.map((doc) => (
                <Card key={doc.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <FileText className="h-8 w-8 text-primary" />
                      <Badge variant={getDocumentTypeColor(doc.document_type)}>
                        {doc.document_type}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg mt-2">{doc.title}</CardTitle>
                    <CardDescription>
                      {new Date(doc.created_at).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {doc.ai_summary ? (
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {doc.ai_summary}
                      </p>
                    ) : (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <AlertCircle className="h-4 w-4 mr-2" />
                        {t('analysisInProgress')}
                      </div>
                    )}
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
