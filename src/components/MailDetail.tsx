import { useState, useEffect, useRef, useMemo } from 'react';
import { MailItem, AnalysisResult, ToneOfVoice, Language } from '@/types';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatDistanceToNow, format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { 
  Paperclip, 
  Send, 
  Edit, 
  CheckCircle2, 
  RefreshCw,
  Sparkles,
  Brain,
  Mail as MailIcon,
  FileIcon,
  Trash2,
  Pencil,
  ShieldAlert
} from 'lucide-react';
import { generateSmartReplies } from '@/lib/ai/orchestrator';
import { analyzeEmail } from '@/lib/ai';
import { useToast } from '@/hooks/use-toast';
import { SecurityError, handleSecurityError } from '@/lib/security';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { EmailBodyRenderer } from '@/components/EmailBodyRenderer';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import type { TemplateItem } from '@/types';
import { FileText, MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Undo2, Inbox, Archive, Star, MailOpen, Tag, Printer, Code, Download, Ban, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type React from 'react';
import { ComposeEmail } from '@/components/ComposeEmail';
import type { EmailConnection } from '@/types/email';
import { canReplyAll, type ComposeMode } from '@/lib/mail-compose';
import { Reply, ReplyAll, Forward } from 'lucide-react';

export interface MailActions {
  onArchive: (mail: MailItem) => void;
  onDelete: (mail: MailItem) => void;
  onSpam: (mail: MailItem) => void;
  onRestore: (mail: MailItem) => void;
  onToggleStar: (mail: MailItem) => void;
  onToggleRead: (mail: MailItem) => void;
  onSaveLabels: (mail: MailItem, labels: string[]) => void;
}

const escapeHtml = (v: string) => v.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

function buildEml(mail: MailItem): string {
  const lines = [
    `From: ${mail.from}${mail.fromEmail && mail.fromEmail !== mail.from ? ` <${mail.fromEmail}>` : ''}`,
    `To: ${mail.to.join(', ')}`,
    ...(mail.cc && mail.cc.length ? [`Cc: ${mail.cc.join(', ')}`] : []),
    `Subject: ${mail.subject}`,
    `Date: ${new Date(mail.receivedAt).toUTCString()}`,
    ...(mail.externalId ? [`Message-ID: <${mail.externalId}>`] : []),
    'MIME-Version: 1.0',
  ];
  if (mail.bodyHtml) {
    lines.push('Content-Type: text/html; charset=UTF-8', '', mail.bodyHtml);
  } else {
    lines.push('Content-Type: text/plain; charset=UTF-8', '', mail.bodyText || mail.body || '');
  }
  return lines.join('\r\n');
}

const MailMoreMenu = ({ onPhishing, onResolved, onLabels, onPrint, onOriginal, onDownload, onSpam }: {
  onPhishing: () => void; onResolved: () => void; onLabels?: () => void; onPrint?: () => void;
  onOriginal?: () => void; onDownload?: () => void; onSpam?: () => void;
}) => {
  const { t } = useTranslation();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="h-11 w-11 flex-shrink-0" aria-label={t('mailActions.more')} title={t('mailActions.more')}>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {onLabels && <DropdownMenuItem onClick={onLabels}><Tag className="h-4 w-4 mr-2" />{t('mailActions.labels')}</DropdownMenuItem>}
        {onPrint && <DropdownMenuItem onClick={onPrint}><Printer className="h-4 w-4 mr-2" />{t('mailActions.print')}</DropdownMenuItem>}
        {onOriginal && <DropdownMenuItem onClick={onOriginal}><Code className="h-4 w-4 mr-2" />{t('mailActions.viewOriginal')}</DropdownMenuItem>}
        {onDownload && <DropdownMenuItem onClick={onDownload}><Download className="h-4 w-4 mr-2" />{t('mailActions.downloadEml')}</DropdownMenuItem>}
        <DropdownMenuSeparator />
        {onSpam && <DropdownMenuItem onClick={onSpam}><Ban className="h-4 w-4 mr-2" />{t('mailActions.markSpam')}</DropdownMenuItem>}
        <DropdownMenuItem onClick={onPhishing} className="text-destructive focus:text-destructive"><ShieldAlert className="h-4 w-4 mr-2" />{t('mailActions.markPhishing')}</DropdownMenuItem>
        <DropdownMenuItem onClick={onResolved}><CheckCircle2 className="h-4 w-4 mr-2" />{t('mailActions.markResolved')}</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const ActionIcon = ({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Button variant="ghost" size="icon" className="h-11 w-11" aria-label={label} onClick={onClick}>{children}</Button>
    </TooltipTrigger>
    <TooltipContent>{label}</TooltipContent>
  </Tooltip>
);

interface MailDetailProps {
  mail: MailItem | null;
  className?: string;
  actions?: MailActions;
  connections?: EmailConnection[];
  onDraftSaved?: () => void;
}

export function MailDetail({ mail, className, actions, connections = [], onDraftSaved }: MailDetailProps) {
  const [composeMode, setComposeMode] = useState<ComposeMode | null>(null);
  const { t } = useTranslation();
  const [labelsOpen, setLabelsOpen] = useState(false);
  const [labelDraft, setLabelDraft] = useState<string[]>([]);
  const [newLabel, setNewLabel] = useState('');
  const [originalOpen, setOriginalOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [reply, setReply] = useState('');
  const [isGeneratingReply, setIsGeneratingReply] = useState(false);
  const [isEditingReply, setIsEditingReply] = useState(false);
  const [tone, setTone] = useState<ToneOfVoice>('Neutraal');
  const [language, setLanguage] = useState<Language>('NL');
  const [threadSummary, setThreadSummary] = useState<string | null>(null);
  const [threadMessageCount, setThreadMessageCount] = useState<number>(1);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [userTemplates, setUserTemplates] = useState<TemplateItem[]>([]);
  const autoGeneratedForRef = useRef<string | null>(null);
  const { toast } = useToast();

  // Load user's real templates from Supabase
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from('templates')
        .select('id, name, category, language, body, updated_at')
        .eq('user_id', user.id);
      if (!cancelled && !error && data) {
        setUserTemplates(
          data.map((t: any) => ({
            id: t.id,
            name: t.name,
            category: t.category,
            language: t.language,
            body: t.body || '',
            updatedAt: t.updated_at,
          }))
        );
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  // Reset state when mail changes
  useEffect(() => {
    setComposeMode(null);
    if (mail) {
      setReply('');
      setAnalysis(null);
      setIsEditingReply(false);
      setThreadSummary(null);
      setThreadMessageCount(1);
      autoGeneratedForRef.current = null;
      loadThreadSummary();
    } else {
      setAnalysis(null);
      setReply('');
    }
  }, [mail?.id]);

  // Auto-suggest tone based on sentiment + urgency
  useEffect(() => {
    const unhappy = analysis?.sentiment === 'Negatief' || mail?.customerSentiment === 'unhappy';
    if (unhappy) {
      setTone('Empathisch');
    } else if (analysis?.urgency === 'Hoog') {
      setTone('Formeel');
    }
  }, [analysis?.sentiment, analysis?.urgency, mail?.customerSentiment]);

  // Template recommendation: match against the user's REAL templates (from Supabase),
  // never against dummy demo data. Returns null when the user has no matching template.
  const recommendedTemplate = useMemo(() => {
    if (!analysis || userTemplates.length === 0) return null;
    const cat = analysis.category;
    const exact = userTemplates.find(t => t.category === cat && t.language === language);
    if (exact) return exact;
    const sameCat = userTemplates.find(t => t.category === cat);
    if (sameCat) return sameCat;
    return userTemplates.find(t => t.category === 'Algemeen' && t.language === language)
      || userTemplates.find(t => t.category === 'Algemeen')
      || null;
  }, [analysis?.category, language, userTemplates]);

  const applyTemplate = () => {
    if (!recommendedTemplate || !mail) return;
    const customerName = (mail.from || '').split(/[<\s]/)[0] || 'klant';
    const body = recommendedTemplate.body.replace(/\{\{naam\}\}/g, customerName);
    setReply(body);
    setComposeMode('reply');
    setIsEditingReply(true);
    toast({ title: '📋 Template toegepast', description: recommendedTemplate.name });
  };

  // Auto-generate an AI reply as soon as an analysis becomes available for this mail.
  // One click on "Analyseer" now yields both an analysis AND a first reply suggestion.
  useEffect(() => {
    if (!mail || !analysis) return;
    if (autoGeneratedForRef.current === mail.id) return;
    if (reply || isGeneratingReply) return;
    autoGeneratedForRef.current = mail.id;
    generateAiReply();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analysis?.category, mail?.id]);


  const loadThreadSummary = async () => {
    if (!mail) return;
    setIsSummarizing(true);
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) return;
      const { data, error } = await supabase.functions.invoke('summarize-thread', {
        body: { emailId: mail.id },
        headers: { Authorization: `Bearer ${session.session.access_token}` },
      });
      if (!error && data?.success) {
        setThreadSummary(data.summary);
        setThreadMessageCount(data.messageCount || 1);
      }
    } catch (e) {
      console.warn('Thread summary failed:', e);
    } finally {
      setIsSummarizing(false);
    }
  };

  const refreshThreadSummary = async () => {
    if (!mail) return;
    setIsSummarizing(true);
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) return;
      const { data, error } = await supabase.functions.invoke('summarize-thread', {
        body: { emailId: mail.id, force: true },
        headers: { Authorization: `Bearer ${session.session.access_token}` },
      });
      if (!error && data?.success) {
        setThreadSummary(data.summary);
        setThreadMessageCount(data.messageCount || 1);
        toast({ title: '✅ Samenvatting bijgewerkt' });
      }
    } catch (e) {
      console.warn('Thread summary refresh failed:', e);
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleCategoryChange = async (newCategory: string) => {
    if (!mail || !analysis) return;
    const original = analysis.category;
    if (original === newCategory) return;
    setAnalysis(prev => prev ? { ...prev, category: newCategory as any, fromCorrection: true } : prev);
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const fromRaw = (mail.from || '').toString();
      const emailMatch = fromRaw.match(/<([^>]+)>/);
      const senderEmail = (emailMatch ? emailMatch[1] : fromRaw).toLowerCase().trim() || null;

      // Try to find an existing weighted row for sender+corrected_category
      let existingId: string | null = null;
      let existingCount = 0;
      if (senderEmail) {
        const { data: existing } = await supabase
          .from('email_category_corrections')
          .select('id, correction_count')
          .eq('user_id', user.id)
          .eq('sender_email', senderEmail)
          .eq('corrected_category', newCategory)
          .maybeSingle();
        if (existing) {
          existingId = (existing as any).id;
          existingCount = (existing as any).correction_count || 1;
        }
      }

      if (existingId) {
        await supabase
          .from('email_category_corrections')
          .update({
            correction_count: existingCount + 1,
            updated_at: new Date().toISOString(),
            original_category: original,
            email_subject: mail.subject,
            email_snippet: (mail.snippet || mail.bodyText || '').substring(0, 200),
            email_id: mail.id,
          })
          .eq('id', existingId);
      } else {
        await supabase.from('email_category_corrections').insert({
          user_id: user.id,
          email_id: mail.id,
          sender_email: senderEmail,
          original_category: original,
          corrected_category: newCategory,
          email_subject: mail.subject,
          email_snippet: (mail.snippet || mail.bodyText || '').substring(0, 200),
        });
      }

      // Reflect on the email row so the badge can show the learned indicator
      await supabase
        .from('emails')
        .update({ ai_category: newCategory, category_from_correction: true })
        .eq('id', mail.id)
        .eq('user_id', user.id);

      toast({ title: '✓ Correctie opgeslagen', description: 'De AI leert van je aanpassing.' });
    } catch (e) {
      console.warn('Failed to log category correction:', e);
    }
  };


  const analyzeCurrentMail = async () => {
    if (!mail) return;

    setIsAnalyzing(true);
    try {
      const result = await analyzeEmail(mail);
      setAnalysis(result);
    } catch (error) {
      const errorMessage = error instanceof SecurityError 
        ? error.message 
        : handleSecurityError(error);
      console.error('Analysis failed:', error);
      toast({
        title: "Analyse mislukt",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateAiReply = async () => {
    if (!mail) return;

    setIsGeneratingReply(true);
    try {
      const result = await generateSmartReplies({
        mail,
        tone,
        language,
        analysis
      });
      
      if (result.success && result.variants && result.variants.length > 0) {
        setReply(result.variants[0].content);
        setComposeMode('reply');
        toast({
          title: "✅ AI antwoord gegenereerd",
          description: `Antwoord gegenereerd met ${result.provider} (${result.model})`,
        });
      } else {
        throw new Error('No variants generated');
      }
    } catch (error) {
      console.error('Reply generation failed:', error);
      toast({
        title: "Antwoord genereren mislukt",
        description: "Er is een fout opgetreden bij het genereren van het antwoord. Probeer het opnieuw.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingReply(false);
    }
  };

  const handleMarkAsResolved = () => {
    toast({
      title: "✅ Email afgehandeld", 
      description: "De email is gemarkeerd als afgehandeld."
    });
  };

  if (!mail) {
  return (
      <div className={`bg-card flex items-center justify-center ${className}`}>
        <div className="text-center text-muted-foreground">
          <MailIcon className="h-16 w-16 mx-auto mb-4 opacity-30" />
          <p className="text-xl mb-2">Selecteer een email</p>
          <p className="text-sm">Kies een email uit de inbox om de details te bekijken</p>
        </div>
      </div>
    );
  }

  const timeAgo = formatDistanceToNow(new Date(mail.receivedAt), { 
    addSuffix: true, 
    locale: nl 
  });

  const fullDate = format(new Date(mail.receivedAt), "PPP 'om' HH:mm", { locale: nl });

  const getCategoryClassName = (category: string): string => {
    const classes: Record<string, string> = {
      'Retour': 'category-retour',
      'Klacht': 'category-klacht', 
      'Factuur': 'category-factuur',
      'Vraag': 'category-vraag',
      'Technisch': 'category-technisch',
      'Overig': 'category-overig'
    };
    return classes[category] || 'category-overig';
  };

  const getUrgencyClassName = (urgency: string): string => {
    const classes: Record<string, string> = {
      'Hoog': 'bg-destructive text-destructive-foreground',
      'Normaal': 'bg-warning text-warning-foreground', 
      'Laag': 'bg-success text-success-foreground'
    };
    return classes[urgency] || 'bg-muted text-muted-foreground';
  };

  const isUnhappy = analysis?.sentiment === 'Negatief' || mail?.customerSentiment === 'unhappy';

  const markAsPhishing = () => {
  if (!mail) return;
  const blocked = JSON.parse(localStorage.getItem('servio_blocked_senders') || '[]');
  if (!blocked.includes(mail.from)) {
    blocked.push(mail.from);
    localStorage.setItem('servio_blocked_senders', JSON.stringify(blocked));
  }
  toast({ title: t('mailActions.phishingTitle'), description: t('mailActions.phishingDesc', { from: mail.from }) });
};

const openLabels = () => { if (!mail) return; setLabelDraft(mail.labels.filter(l => l === l.toLowerCase() || !/^[A-Z_]+$/.test(l))); setNewLabel(''); setLabelsOpen(true); };
const saveLabels = () => {
  if (!mail || !actions) return;
  const system = mail.labels.filter(l => /^[A-Z_]+$/.test(l) && l !== l.toLowerCase());
  actions.onSaveLabels(mail, [...system, ...labelDraft]);
  setLabelsOpen(false);
};
const addDraftLabel = () => {
  const v = newLabel.trim().slice(0, 40);
  if (v && !labelDraft.includes(v)) setLabelDraft([...labelDraft, v]);
  setNewLabel('');
};

const printMail = () => {
  if (!mail) return;
  const w = window.open('', '_blank', 'noopener=no,width=800,height=900');
  if (!w) return;
  const body = escapeHtml(mail.bodyText || buildEml(mail).split('\r\n\r\n').slice(1).join('\n').replace(/<[^>]+>/g, ''));
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(mail.subject)}</title><style>body{font-family:Inter,system-ui,sans-serif;padding:32px;color:#111}h1{font-size:20px}dl{font-size:13px;color:#555}pre{white-space:pre-wrap;font-family:inherit;font-size:14px;line-height:1.6}</style></head><body><h1>${escapeHtml(mail.subject)}</h1><dl><div>${escapeHtml(mail.from)}</div><div>${escapeHtml(mail.to.join(', '))}</div><div>${escapeHtml(new Date(mail.receivedAt).toLocaleString())}</div></dl><hr><pre>${body}</pre></body></html>`);
  w.document.close();
  w.focus();
  w.print();
};

const downloadEml = () => {
  if (!mail) return;
  const blob = new Blob([buildEml(mail)], { type: 'message/rfc822' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${(mail.subject || 'email').replace(/[^\w\- ]+/g, '').trim().slice(0, 60) || 'email'}.eml`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const moreMenuProps = {
  onPhishing: markAsPhishing,
  onResolved: handleMarkAsResolved,
  ...(actions && mail ? {
    onLabels: openLabels, onPrint: printMail, onOriginal: () => setOriginalOpen(true), onDownload: downloadEml,
    onSpam: () => actions.onSpam(mail),
  } : {}),
};

const sentimentLabel = (v?: string) => {
  const m: Record<string, string> = { happy: 'Positief', positive: 'Positief', neutral: 'Neutraal', unhappy: 'Negatief', negative: 'Negatief' };
  return v ? (m[v] || v) : undefined;
};

  return (
    <ErrorBoundary>
      <div className={`bg-background overflow-y-auto overflow-x-hidden max-w-full ${className}`}>
        <div className="p-4 sm:p-8 space-y-5 max-w-full">
        {/* Subject header */}
        <div className="pb-5 border-b border-border/60">
          <h1 className="text-[22px] font-bold text-foreground tracking-tight mb-3 leading-tight">
            {mail.subject}
          </h1>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 space-y-1">
              <div className="text-[14px]">
                <span className="font-semibold text-foreground">{mail.from}</span>
              </div>
              <div className="text-[13px] text-muted-foreground">
                Aan: <span className="text-foreground/70">{mail.to.join(', ')}</span>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              {actions && (
                <TooltipProvider delayDuration={300}>
                  <div className="flex flex-wrap items-center justify-end gap-0.5 mb-1" role="toolbar" aria-label={t('mailActions.more')}>
                    <ActionIcon label={t('compose.reply')} onClick={() => setComposeMode('reply')}><Reply className="h-4 w-4" /></ActionIcon>
                    {canReplyAll(mail, connections.map(c => c.email_address)) && <ActionIcon label={t('compose.replyAll')} onClick={() => setComposeMode('replyAll')}><ReplyAll className="h-4 w-4" /></ActionIcon>}
                    <ActionIcon label={t('compose.forward')} onClick={() => setComposeMode('forward')}><Forward className="h-4 w-4" /></ActionIcon>
                    {mail.folder === 'trash' ? (
                      <Button variant="outline" size="sm" className="h-11 mr-1" onClick={() => actions.onRestore(mail)}><Undo2 className="h-4 w-4 mr-1.5" />{t('mailActions.restore')}</Button>
                    ) : mail.folder === 'spam' ? (
                      <>
                        <Button variant="outline" size="sm" className="h-11 mr-1" onClick={() => actions.onRestore(mail)}><Inbox className="h-4 w-4 mr-1.5" />{t('mailActions.notSpam')}</Button>
                        <ActionIcon label={t('mailActions.delete')} onClick={() => actions.onDelete(mail)}><Trash2 className="h-4 w-4" /></ActionIcon>
                      </>
                    ) : (
                      <>
                        {mail.folder !== 'archive' && <ActionIcon label={t('mailActions.archive')} onClick={() => actions.onArchive(mail)}><Archive className="h-4 w-4" /></ActionIcon>}
                        <ActionIcon label={t('mailActions.delete')} onClick={() => actions.onDelete(mail)}><Trash2 className="h-4 w-4" /></ActionIcon>
                      </>
                    )}
                    <ActionIcon label={mail.unread ? t('mailActions.markRead') : t('mailActions.markUnread')} onClick={() => actions.onToggleRead(mail)}>
                      {mail.unread ? <MailOpen className="h-4 w-4" /> : <MailIcon className="h-4 w-4" />}
                    </ActionIcon>
                    <ActionIcon label={mail.starred ? t('mailActions.unstar') : t('mailActions.star')} onClick={() => actions.onToggleStar(mail)}>
                      <Star className={`h-4 w-4 ${mail.starred ? 'fill-warning text-warning' : ''}`} />
                    </ActionIcon>
                    <MailMoreMenu {...moreMenuProps} />
                  </div>
                </TooltipProvider>
              )}
              <div className="text-[13px] text-muted-foreground" title={fullDate}>{timeAgo}</div>
              {mail.unread && (
                <Badge variant="default" className="bg-primary mt-1.5 text-[10px]">Nieuw</Badge>
              )}
            </div>
          </div>

          {mail.attachments && mail.attachments.length > 0 && (
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              {mail.attachments.map((attachment, index) => (
                <div
                  key={index}
                  className="flex items-center gap-1.5 bg-secondary rounded-full px-3 py-1 text-xs"
                >
                  <Paperclip className="h-3 w-3 text-muted-foreground" />
                  <span className="font-medium">{attachment.name}</span>
                  {attachment.sizeKB && (
                    <span className="text-muted-foreground">({attachment.sizeKB}KB)</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Unhappy customer banner */}
        {isUnhappy && (
          <Card className="bg-destructive/5">
            <CardContent className="p-5 flex items-center gap-3">
              <span className="text-2xl">🔴</span>
              <div className="flex-1">
                <p className="font-semibold text-destructive">Ontevreden klant gedetecteerd</p>
                <p className="text-sm text-muted-foreground">De AI antwoordtoon is automatisch op <strong>Empathisch</strong> gezet.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Thread summary */}
        {(threadSummary || isSummarizing) && threadMessageCount > 1 && (
          <Card className="bg-primary/5">
            <CardHeader className="pb-2 p-5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Brain className="h-4 w-4 text-primary" />
                  Samenvatting ({threadMessageCount} berichten)
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={refreshThreadSummary} disabled={isSummarizing}>
                  <RefreshCw className={`h-3 w-3 ${isSummarizing ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0 p-5">
              {isSummarizing && !threadSummary ? (
                <Skeleton className="h-12 w-full" />
              ) : (
                <p className="text-[14px] text-foreground leading-relaxed">{threadSummary}</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Email body — 15px / 1.6 line-height */}
        <div className="text-[15px] leading-[1.6] text-foreground">
          <EmailBodyRenderer
            bodyHtml={mail.bodyHtml}
            bodyText={mail.bodyText || mail.body}
            fromEmail={mail.fromEmail}
          />
        </div>

        {/* Analysis Section */}
        {isAnalyzing ? (
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Brain className="h-5 w-5 mr-2 text-primary" />
                AI Analyse
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ) : !analysis ? (
          <div className="sticky bottom-3 z-20">
            <Card className="rounded-2xl border-primary/20 bg-card/95 backdrop-blur shadow-elevated">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <Sparkles className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="text-sm font-semibold text-foreground mr-1">AI</span>
                  {mail.aiCategory || mail.aiUrgency || mail.customerSentiment ? (
                    <>
                      {mail.aiCategory && <Badge variant="outline" className={getCategoryClassName(mail.aiCategory)}>{mail.aiCategory}</Badge>}
                      {mail.aiUrgency && <Badge className={getUrgencyClassName(mail.aiUrgency as any)}>Urgentie: {mail.aiUrgency}</Badge>}
                      {mail.customerSentiment && <Badge variant="secondary">{sentimentLabel(mail.customerSentiment)}</Badge>}
                    </>
                  ) : (
                    <span className="text-[13px] text-muted-foreground">Wordt automatisch gesorteerd bij de volgende synchronisatie.</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" className="flex-1 sm:flex-none h-11 sm:h-9" onClick={generateAiReply} disabled={isGeneratingReply}>
                    <Sparkles className="h-4 w-4 mr-2" />Antwoord voorstellen
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1 sm:flex-none h-11 sm:h-9" onClick={analyzeCurrentMail}>
                    <Brain className="h-4 w-4 mr-2" />Samenvatten
                  </Button>
                  <MailMoreMenu {...moreMenuProps} />
                </div>
              </CardContent>
            </Card>
          </div>
        ) : analysis && (
          <>
            {/* Summary */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-lg font-bold">📝 Samenvatting</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground font-medium">{analysis.summary}</p>
              </CardContent>
            </Card>

            {/* Category and Urgency */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="text-lg">🏷️ Categorie</CardTitle>
                </CardHeader>
                <CardContent>
                  <Select value={analysis.category} onValueChange={handleCategoryChange}>
                    <SelectTrigger className="w-full">
                      <div className="flex items-center gap-2">
                        <Pencil className="h-3 w-3 text-muted-foreground" />
                        <Badge variant="outline" className={`text-sm font-medium border-2 ${getCategoryClassName(analysis.category)} flex items-center gap-1`}>
                          {analysis.category}
                          {analysis.fromCorrection && (
                            <Sparkles
                              className="h-3 w-3 text-amber-500"
                              aria-label="Categorie geleerd uit eerdere correcties"
                            />
                          )}
                        </Badge>
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {['Retour', 'Klacht', 'Factuur', 'Vraag', 'Technisch', 'Overig'].map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="text-lg">⚡ Urgentie</CardTitle>
                </CardHeader>
                <CardContent>
                  <Select value={analysis.urgency} onValueChange={(val) => setAnalysis(prev => prev ? { ...prev, urgency: val as any } : prev)}>
                    <SelectTrigger className="w-full">
                      <div className="flex items-center gap-2">
                        <Pencil className="h-3 w-3 text-muted-foreground" />
                        <Badge className={`text-sm font-medium ${getUrgencyClassName(analysis.urgency)}`}>
                          {analysis.urgency}
                        </Badge>
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {['Laag', 'Normaal', 'Hoog'].map(urg => (
                        <SelectItem key={urg} value={urg}>{urg}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {/* Financial Data Detection Banner */}
        {mail && (() => {
          const content = (mail.subject + ' ' + (mail.bodyText || mail.body)).toLowerCase();
          const hasInvoice = /factuur|invoice|factuurnummer|bedrag.*€|€\s*\d/.test(content);
          const hasReceipt = /bon|receipt|kassabon|betaalbewijs/.test(content);
          const hasQuote = /offerte|quote|aanbieding|prijsopgave/.test(content);
          const hasTimesheet = /uren|urenregistratie|timesheet|urenspecificatie/.test(content);
          const detected = hasInvoice ? 'factuur' : hasReceipt ? 'bonnetje' : hasQuote ? 'offerte' : hasTimesheet ? 'urenregistratie' : null;
          if (!detected) return null;
          const routes: Record<string, string> = { factuur: '/administration/invoices', bonnetje: '/administration/receipts', offerte: '/administration/quotes', urenregistratie: '/administration/time-tracking' };
          const labels: Record<string, string> = { factuur: 'Facturen', bonnetje: 'Bonnetjes', offerte: 'Offertes', urenregistratie: 'Uren' };
          return (
            <Card className="shadow-card border-warning/30 bg-warning/5">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📎</span>
                  <div>
                    <p className="font-medium text-foreground">Servio heeft een {detected} gedetecteerd in deze email</p>
                    <p className="text-sm text-muted-foreground">Bron: Email van {mail.from} op {format(new Date(mail.receivedAt), 'd MMM yyyy', { locale: nl })}</p>
                  </div>
                </div>
                <Button size="sm" onClick={() => navigate(routes[detected])}>
                  Toevoegen aan {labels[detected]}
                </Button>
              </CardContent>
            </Card>
          );
        })()}

        {/* Template recommendation */}
        {recommendedTemplate && (
          <Card className="shadow-card border-accent/30 bg-accent/5">
            <CardContent className="p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <FileText className="h-5 w-5 text-accent-foreground flex-shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium text-foreground truncate">
                    Aanbevolen template: {recommendedTemplate.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Categorie {recommendedTemplate.category} · {recommendedTemplate.language} · past bij deze email
                  </p>
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={applyTemplate}>
                Gebruik template
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-wrap gap-2 pt-3">
          <Button variant="outline" className="min-h-11 gap-2" onClick={() => setComposeMode('reply')}><Reply className="h-4 w-4" />{t('compose.reply')}</Button>
          {canReplyAll(mail, connections.map(c => c.email_address)) && <Button variant="outline" className="min-h-11 gap-2" onClick={() => setComposeMode('replyAll')}><ReplyAll className="h-4 w-4" />{t('compose.replyAll')}</Button>}
          <Button variant="outline" className="min-h-11 gap-2" onClick={() => setComposeMode('forward')}><Forward className="h-4 w-4" />{t('compose.forward')}</Button>
        </div>
        <ComposeEmail open={composeMode !== null} inline mode={composeMode || 'reply'} mail={mail} connections={connections} hasConnection={connections.some(c => c.is_active)} onOpenChange={open => { if (!open) { setComposeMode(null); setReply(''); } }} onSaved={onDraftSaved} initialBody={reply || undefined} />
        </div>
      </div>
      <Dialog open={labelsOpen} onOpenChange={setLabelsOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t('mailActions.labelsTitle')}</DialogTitle></DialogHeader>
          <div className="flex flex-wrap gap-2 min-h-[2rem]">
            {labelDraft.map(l => (
              <Badge key={l} variant="secondary" className="gap-1 pr-1">
                {l}
                <button type="button" aria-label={`${t('mailActions.delete')} ${l}`} className="p-1" onClick={() => setLabelDraft(labelDraft.filter(x => x !== l))}><X className="h-3 w-3" /></button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input value={newLabel} maxLength={40} placeholder={t('mailActions.labelsPlaceholder')} onChange={(e) => setNewLabel(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addDraftLabel(); } }} />
            <Button variant="outline" onClick={addDraftLabel}>{t('mailActions.add')}</Button>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setLabelsOpen(false)}>{t('mailActions.cancel')}</Button>
            <Button onClick={saveLabels}>{t('mailActions.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={originalOpen} onOpenChange={setOriginalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('mailActions.originalTitle')}</DialogTitle>
            <DialogDescription>{t('mailActions.originalNote')}</DialogDescription>
          </DialogHeader>
          <pre className="text-xs bg-muted rounded-[10px] p-4 overflow-auto max-h-[50vh] whitespace-pre-wrap break-all">{mail ? buildEml(mail).split('\r\n\r\n')[0] : ''}</pre>
          <DialogFooter><Button variant="outline" onClick={() => setOriginalOpen(false)}>{t('mailActions.close')}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </ErrorBoundary>
  );
}