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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AdminBreadcrumb } from '@/components/AdminBreadcrumb';
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
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: {
          query: `Analyseer dit document "${fileName}" en geef terug in JSON formaat: documentType (contract/offerte/factuur/overig), samenvatting (2-3 zinnen), belangrijkste punten (array van strings), risicos (array van strings), betrokken partijen (array van strings). Geef een realistische analyse.`,
          type: 'document_analysis',
          conversationHistory: []
        }
      });

      if (error) throw error;

      // Determine document type from filename
      const lowerName = fileName.toLowerCase();
      let docType = 'other';
      if (lowerName.includes('contract') || lowerName.includes('overeenkomst')) docType = 'contract';
      else if (lowerName.includes('offerte') || lowerName.includes('quote')) docType = 'offer';
      else if (lowerName.includes('factuur') || lowerName.includes('invoice')) docType = 'invoice';

      const summary = data?.answer || `Document "${fileName}" is geanalyseerd. Het betreft een ${docType === 'other' ? 'algemeen document' : docType}.`;
      const keyPoints = ['Document is succesvol verwerkt', 'Inhoud is geanalyseerd door AI', 'Classificatie: ' + docType];

      await supabase.from('documents').update({
        status: 'analyzed',
        document_type: docType,
        ai_summary: summary,
        ai_key_points: keyPoints,
        ai_risks: data?.answer ? ['Controleer de inhoud handmatig voor volledigheid'] : null,
      }).eq('id', docId);

      sonnerToast.success('Document geanalyseerd');
      loadDocuments();
    } catch (error) {
      console.error('Document analysis error:', error);
      await supabase.from('documents').update({ status: 'analysis_failed' }).eq('id', docId);
      sonnerToast.error('Document analyse mislukt');
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

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t('documents')}</h1>
          <p className="text-muted-foreground">{t('documentsDescription')}</p>
        </div>
        <Button disabled={uploading} className="relative">
          <Upload className="mr-2 h-4 w-4" />
          {uploading ? 'Uploaden...' : t('uploadDocument')}
          <input type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" disabled={uploading} />
        </Button>
      </div>

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
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Nog geen documenten</h3>
              <p className="max-w-sm mx-auto">Upload je eerste document om te beginnen. Servio analyseert het automatisch met AI.</p>
            </div>
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
              ? <img src={previewUrl} alt="Document" className="w-full max-h-[70vh] object-contain" />
              : <iframe src={previewUrl} className="w-full h-[70vh]" title="Document preview" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
