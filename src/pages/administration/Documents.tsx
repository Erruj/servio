import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Upload, FileText, Search, AlertCircle, CheckCircle, Loader2, Eye, Trash2, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AdminBreadcrumb } from '@/components/AdminBreadcrumb';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { toast as sonnerToast } from 'sonner';

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
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const { data, error } = await supabase.from('documents').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      toast({ title: 'Fout', description: 'Alleen PDF, afbeeldingen en Word bestanden zijn toegestaan.', variant: 'destructive' });
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      toast({ title: 'Fout', description: 'Bestand is te groot (max 15MB).', variant: 'destructive' });
      return;
    }

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const fileName = `${user.id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage.from('financial-documents').upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data: newDoc, error: insertError } = await supabase
        .from('documents')
        .insert({
          user_id: user.id,
          file_path: fileName,
          title: file.name.replace(/\.[^/.]+$/, ''),
          document_type: 'other',
          status: 'analyzing'
        })
        .select()
        .single();

      if (insertError) throw insertError;

      sonnerToast.success('Document geüpload — AI analyse gestart...');
      loadDocuments();

      // Trigger AI analysis
      analyzeDocument(newDoc.id, file.name);
    } catch (error) {
      console.error('Error uploading document:', error);
      toast({ title: 'Fout', description: 'Document kon niet worden geüpload.', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const analyzeDocument = async (docId: string, fileName: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: sessionData } = await supabase.auth.getSession();
      
      const doc = documents.find(d => d.id === docId);
      const filePath = doc?.file_path || fileName;

      const { data, error } = await supabase.functions.invoke('analyze-document', {
        body: { documentId: docId, filePath, fileName },
        headers: sessionData.session ? { Authorization: `Bearer ${sessionData.session.access_token}` } : undefined,
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      sonnerToast.success('Document geanalyseerd met OCR');
      loadDocuments();
    } catch (error) {
      console.error('Document analysis error:', error);
      await supabase.from('documents').update({ status: 'analysis_failed' }).eq('id', docId);
      sonnerToast.error('Document analyse mislukt — probeer het opnieuw');
      loadDocuments();
    }
  };

  const handleViewDocument = async (doc: Document) => {
    try {
      const { data } = await supabase.storage.from('financial-documents').createSignedUrl(doc.file_path, 3600);
      if (data?.signedUrl) {
        setPreviewUrl(data.signedUrl);
        setSelectedDoc(doc);
      }
    } catch { sonnerToast.error('Bestand kon niet worden geopend'); }
  };

  const handleDownloadDocument = async (doc: Document) => {
    try {
      const { data } = await supabase.storage.from('financial-documents').createSignedUrl(doc.file_path, 3600);
      if (data?.signedUrl) {
        const a = document.createElement('a');
        a.href = data.signedUrl;
        a.download = doc.title;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch { sonnerToast.error('Download mislukt'); }
  };

  const handleDeleteDocument = async () => {
    if (!deleteId) return;
    try {
      const doc = documents.find(d => d.id === deleteId);
      if (doc) await supabase.storage.from('financial-documents').remove([doc.file_path]);
      await supabase.from('documents').delete().eq('id', deleteId);
      sonnerToast.success('Document verwijderd');
      setDeleteId(null);
      loadDocuments();
    } catch { sonnerToast.error('Verwijderen mislukt'); }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || doc.document_type === filterType;
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'analyzing': return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20"><Loader2 className="h-3 w-3 mr-1 animate-spin" />Analyseren...</Badge>;
      case 'analyzed': return <Badge className="bg-green-500/10 text-green-600 border-green-500/20"><CheckCircle className="h-3 w-3 mr-1" />Geanalyseerd</Badge>;
      case 'analysis_failed': return <Badge className="bg-red-500/10 text-red-600 border-red-500/20"><AlertCircle className="h-3 w-3 mr-1" />Analyse mislukt</Badge>;
      default: return <Badge variant="secondary">{status || 'Geüpload'}</Badge>;
    }
  };

  return (
    <div className="space-y-6 p-6">
      <AdminBreadcrumb currentPage="Documenten" />

      <PageHeader
        title={t('documents')}
        description={t('documentsDescription')}
        actions={
          <Button disabled={uploading} className="relative">
            <Upload className="mr-2 h-4 w-4" />
            {uploading ? 'Uploaden...' : t('uploadDocument')}
            <input type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" disabled={uploading} />
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div><CardTitle>{t('allDocuments')}</CardTitle><CardDescription>{t('manageYourDocuments')}</CardDescription></div>
            <div className="flex items-center gap-2">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('all')}</SelectItem>
                  <SelectItem value="contract">Contracten</SelectItem>
                  <SelectItem value="offer">Offertes</SelectItem>
                  <SelectItem value="invoice">Facturen</SelectItem>
                  <SelectItem value="other">Overig</SelectItem>
                </SelectContent>
              </Select>
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input placeholder="Zoek documenten..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-64" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>
          ) : filteredDocuments.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="Nog geen documenten"
              description="Upload je eerste document om te beginnen. Servio analyseert het automatisch met AI."
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredDocuments.map((doc) => (
                <Card key={doc.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <FileText className="h-8 w-8 text-primary" />
                      <div className="flex items-center gap-2">
                        {getStatusBadge(doc.status)}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">⋮</Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewDocument(doc)}><Eye className="h-4 w-4 mr-2" />Bekijken</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDownloadDocument(doc)}><Download className="h-4 w-4 mr-2" />Downloaden</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(doc.id)}><Trash2 className="h-4 w-4 mr-2" />Verwijderen</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    <CardTitle className="text-lg mt-2">{doc.title}</CardTitle>
                    <CardDescription>{new Date(doc.created_at).toLocaleDateString('nl-NL')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {doc.ai_summary ? (
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground line-clamp-3">{doc.ai_summary}</p>
                        {doc.ai_key_points && Array.isArray(doc.ai_key_points) && doc.ai_key_points.length > 0 && (
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-foreground">Belangrijkste punten:</p>
                            {(doc.ai_key_points as string[]).slice(0, 2).map((point, i) => (
                              <p key={i} className="text-xs text-muted-foreground">• {point}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : doc.status === 'analyzing' ? (
                      <div className="flex items-center text-sm text-muted-foreground"><Loader2 className="h-4 w-4 mr-2 animate-spin" />AI analyseert document...</div>
                    ) : doc.status === 'analysis_failed' ? (
                      <div className="flex items-center text-sm text-destructive"><AlertCircle className="h-4 w-4 mr-2" />Analyse mislukt — probeer opnieuw te uploaden</div>
                    ) : (
                      <div className="flex items-center text-sm text-muted-foreground"><AlertCircle className="h-4 w-4 mr-2" />Wacht op analyse...</div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Document verwijderen?</AlertDialogTitle>
            <AlertDialogDescription>Dit kan niet ongedaan worden gemaakt.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteDocument} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Verwijderen</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Preview modal */}
      <Dialog open={!!previewUrl} onOpenChange={(open) => { if (!open) { setPreviewUrl(null); setSelectedDoc(null); } }}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader><DialogTitle>{selectedDoc?.title || 'Document'}</DialogTitle></DialogHeader>
          {previewUrl && (
            /\.(jpg|jpeg|png|gif|webp)$/i.test(selectedDoc?.file_path || '')
              ? <img src={previewUrl} alt="Preview of uploaded document" className="w-full max-h-[70vh] object-contain" />
              : <iframe src={previewUrl} className="w-full h-[70vh]" title="Document preview" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
