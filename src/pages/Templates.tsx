import { useEffect, useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TemplateItem, Category, Language } from '@/types';
import { templateSchema, searchQuerySchema, sanitizeText, SecurityError } from '@/lib/security';
import {
  Plus,
  Edit,
  Copy,
  Trash2,
  FileText,
  Search,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { ConfirmDialog } from '@/components/ConfirmDialog';

interface DbTemplateRow {
  id: string;
  name: string;
  category: string;
  language: string;
  body: string;
  updated_at: string;
}

const rowToTemplate = (r: DbTemplateRow): TemplateItem => ({
  id: r.id,
  name: r.name,
  category: (r.category as Category | 'Algemeen') ?? 'Algemeen',
  language: (r.language as Language) ?? 'NL',
  body: r.body || '',
  updatedAt: r.updated_at,
});

const Templates = () => {
  const { user, signOut } = useAuth();
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TemplateItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TemplateItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    category: 'Algemeen' as Category | 'Algemeen',
    language: 'NL' as Language,
    body: '',
  });

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('templates')
        .select('id, name, category, language, body, updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });
      if (cancelled) return;
      if (error) {
        toast({ title: 'Templates laden mislukt', description: error.message, variant: 'destructive' });
      } else {
        setTemplates((data || []).map(rowToTemplate));
      }
      setIsLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  const handleSearchChange = (value: string) => {
    try {
      if (value.length > 0) searchQuerySchema.parse(value);
      setSearchQuery(sanitizeText(value));
    } catch (error) {
      if (error instanceof SecurityError) {
        toast({
          title: 'Ongeldige zoekopdracht',
          description: 'Gebruik alleen letters, cijfers en basis leestekens.',
          variant: 'destructive',
        });
        return;
      }
      setSearchQuery(sanitizeText(value));
    }
  };

  const filteredTemplates = templates.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.body.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateNew = () => {
    setEditingTemplate(null);
    setFormData({ name: '', category: 'Algemeen', language: 'NL', body: '' });
    setIsDialogOpen(true);
  };

  const handleEdit = (template: TemplateItem) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      category: template.category,
      language: template.language,
      body: template.body,
    });
    setIsDialogOpen(true);
  };

  const handleDuplicate = async (template: TemplateItem) => {
    if (!user) return;
    const { data, error } = await supabase
      .from('templates')
      .insert({
        user_id: user.id,
        name: `${template.name} (kopie)`,
        category: template.category,
        language: template.language,
        body: template.body,
      })
      .select('id, name, category, language, body, updated_at')
      .single();
    if (error || !data) {
      toast({ title: 'Dupliceren mislukt', description: error?.message, variant: 'destructive' });
      return;
    }
    setTemplates((prev) => [rowToTemplate(data as DbTemplateRow), ...prev]);
    toast({ title: 'Template gedupliceerd', description: `"${template.name}" is gekopieerd.` });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase.from('templates').delete().eq('id', deleteTarget.id);
      if (error) throw error;
      setTemplates((prev) => prev.filter((t) => t.id !== deleteTarget.id));
      toast({ title: 'Template verwijderd', description: `"${deleteTarget.name}" is verwijderd.` });
      setDeleteTarget(null);
    } catch (err: any) {
      toast({ title: 'Verwijderen mislukt', description: err?.message, variant: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    try {
      templateSchema.parse({
        name: formData.name,
        category: formData.category as Category,
        language: formData.language,
        body: formData.body,
      });
    } catch {
      toast({
        title: 'Validatie fout',
        description: 'Controleer de invoer. Naam en inhoud zijn verplicht en mogen alleen geldige tekens bevatten.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    if (editingTemplate) {
      const { data, error } = await supabase
        .from('templates')
        .update({
          name: formData.name,
          category: formData.category,
          language: formData.language,
          body: formData.body,
        })
        .eq('id', editingTemplate.id)
        .select('id, name, category, language, body, updated_at')
        .single();
      setIsSaving(false);
      if (error || !data) {
        toast({ title: 'Opslaan mislukt', description: error?.message, variant: 'destructive' });
        return;
      }
      const updated = rowToTemplate(data as DbTemplateRow);
      setTemplates((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      toast({ title: 'Template bijgewerkt', description: `"${updated.name}" is opgeslagen.` });
    } else {
      const { data, error } = await supabase
        .from('templates')
        .insert({
          user_id: user.id,
          name: formData.name,
          category: formData.category,
          language: formData.language,
          body: formData.body,
        })
        .select('id, name, category, language, body, updated_at')
        .single();
      setIsSaving(false);
      if (error || !data) {
        toast({ title: 'Aanmaken mislukt', description: error?.message, variant: 'destructive' });
        return;
      }
      const created = rowToTemplate(data as DbTemplateRow);
      setTemplates((prev) => [created, ...prev]);
      toast({ title: 'Template aangemaakt', description: `"${created.name}" is toegevoegd.` });
    }

    setIsDialogOpen(false);
    setEditingTemplate(null);
  };

  const getCategoryColor = (category: Category | 'Algemeen') => {
    const colors: Record<string, string> = {
      Retour: 'bg-blue-100 text-blue-800',
      Klacht: 'bg-red-100 text-red-800',
      Factuur: 'bg-green-100 text-green-800',
      Vraag: 'bg-purple-100 text-purple-800',
      Technisch: 'bg-orange-100 text-orange-800',
      Overig: 'bg-gray-100 text-gray-800',
      Algemeen: 'bg-slate-100 text-slate-800',
    };
    return colors[category] || colors['Algemeen'];
  };

  const getLanguageFlag = (language: Language) => {
    const flags: Record<string, string> = { NL: '🇳🇱', EN: '🇬🇧', DE: '🇩🇪', FR: '🇫🇷' };
    return flags[language] || '🏳️';
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header user={user} onLogout={signOut} />

      <div className="flex-1 flex">
        <Sidebar />

        <div className="flex-1 overflow-y-auto">
          <div className="p-8 space-y-8">
            <PageHeader
              title="Templates"
              description="Beheer je email templates voor snellere antwoorden"
              actions={
                <Button onClick={handleCreateNew}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nieuwe Template
                </Button>
              }
            />

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Zoek in templates..."
                      value={searchQuery}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      className="pl-10"
                      maxLength={100}
                    />
                  </div>
                  <Badge variant="secondary">
                    {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Templates ({filteredTemplates.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Naam</TableHead>
                        <TableHead>Categorie</TableHead>
                        <TableHead>Taal</TableHead>
                        <TableHead>Laatst bijgewerkt</TableHead>
                        <TableHead className="text-right">Acties</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTemplates.map((template) => (
                        <TableRow key={template.id}>
                          <TableCell className="font-medium">{template.name}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className={getCategoryColor(template.category)}>
                              {template.category}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="flex items-center">
                              {getLanguageFlag(template.language)} {template.language}
                            </span>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDistanceToNow(new Date(template.updatedAt), {
                              addSuffix: true,
                              locale: nl,
                            })}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <Button variant="ghost" size="sm" onClick={() => handleEdit(template)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDuplicate(template)}>
                                <Copy className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteTarget(template)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}

                {!isLoading && filteredTemplates.length === 0 && (
                  <EmptyState
                    icon={FileText}
                    title={searchQuery ? 'Geen templates gevonden' : 'Nog geen templates'}
                    description={
                      searchQuery
                        ? 'Probeer een andere zoekterm'
                        : 'Maak je eerste template aan met de knop hierboven.'
                    }
                    action={
                      searchQuery
                        ? undefined
                        : { label: 'Nieuwe Template', onClick: handleCreateNew, icon: Plus }
                    }
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'Template Bewerken' : 'Nieuwe Template'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Naam</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: sanitizeText(e.target.value) }))}
                  placeholder="Template naam..."
                  maxLength={100}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Categorie</label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, category: value as Category | 'Algemeen' }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Algemeen">Algemeen</SelectItem>
                    <SelectItem value="Retour">Retour</SelectItem>
                    <SelectItem value="Klacht">Klacht</SelectItem>
                    <SelectItem value="Factuur">Factuur</SelectItem>
                    <SelectItem value="Vraag">Vraag</SelectItem>
                    <SelectItem value="Technisch">Technisch</SelectItem>
                    <SelectItem value="Overig">Overig</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Taal</label>
              <Select
                value={formData.language}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, language: value as Language }))}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NL">🇳🇱 Nederlands</SelectItem>
                  <SelectItem value="EN">🇬🇧 English</SelectItem>
                  <SelectItem value="DE">🇩🇪 Deutsch</SelectItem>
                  <SelectItem value="FR">🇫🇷 Français</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Template Inhoud</label>
              <Textarea
                value={formData.body}
                onChange={(e) => setFormData((prev) => ({ ...prev, body: sanitizeText(e.target.value) }))}
                placeholder="Template inhoud met placeholders zoals {{naam}}, {{order_id}}, etc..."
                className="min-h-48"
                maxLength={5000}
              />
              <p className="text-xs text-muted-foreground">
                Gebruik placeholders: {`{{naam}}, {{order_id}}, {{bedrag}}, {{reset_link}}, {{invoice_number}}`}
              </p>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSaving}>
                Annuleren
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? 'Opslaan...' : editingTemplate ? 'Bijwerken' : 'Aanmaken'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Templates;
