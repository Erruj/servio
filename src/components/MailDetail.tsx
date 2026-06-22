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
import { dummyTemplates } from '@/lib/dummy';
import { FileText } from 'lucide-react';

interface MailDetailProps {
  mail: MailItem | null;
  className?: string;
}

export function MailDetail({ mail, className }: MailDetailProps) {
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [reply, setReply] = useState('');
  const [isGeneratingReply, setIsGeneratingReply] = useState(false);
  const [isEditingReply, setIsEditingReply] = useState(false);
  const [tone, setTone] = useState<ToneOfVoice>('Neutraal');
  const [language, setLanguage] = useState<Language>('NL');
  const [attachments, setAttachments] = useState<{ file: File; base64: string }[]>([]);
  const [threadSummary, setThreadSummary] = useState<string | null>(null);
  const [threadMessageCount, setThreadMessageCount] = useState<number>(1);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Reset all state when mail changes (do NOT auto-analyze — analysis is user-initiated to avoid rate limits)
  useEffect(() => {
    if (mail) {
      setReply('');
      setAnalysis(null);
      setIsEditingReply(false);
      setAttachments([]);
      setThreadSummary(null);
      setThreadMessageCount(1);
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

  // Template recommendation: best match by category + language, fallback to Algemeen
  const recommendedTemplate = useMemo(() => {
    if (!analysis) return null;
    const cat = analysis.category;
    const exact = dummyTemplates.find(t => t.category === cat && t.language === language);
    if (exact) return exact;
    const sameCat = dummyTemplates.find(t => t.category === cat);
    if (sameCat) return sameCat;
    return dummyTemplates.find(t => t.category === 'Algemeen' && t.language === language)
      || dummyTemplates.find(t => t.category === 'Algemeen')
      || null;
  }, [analysis?.category, language]);

  const applyTemplate = () => {
    if (!recommendedTemplate || !mail) return;
    const customerName = (mail.from || '').split(/[<\s]/)[0] || 'klant';
    const body = recommendedTemplate.body.replace(/\{\{naam\}\}/g, customerName);
    setReply(body);
    setIsEditingReply(true);
    toast({ title: '📋 Template toegepast', description: recommendedTemplate.name });
  };

  // AI reply is user-initiated (no auto-generation on mail change)


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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (const file of Array.from(files)) {
      if (file.size > 10 * 1024 * 1024) {
        toast({ title: `${file.name} is te groot (max 10MB)`, variant: 'destructive' });
        continue;
      }
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      setAttachments(prev => [...prev, { file, base64 }]);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (index: number) => setAttachments(prev => prev.filter((_, i) => i !== index));

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleSendReply = async () => {
    if (!reply.trim()) {
      toast({ title: "Geen inhoud", description: "Voeg eerst inhoud toe aan je antwoord.", variant: "destructive" });
      return;
    }

    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: session } = await supabase.auth.getSession();
      
      const emailAttachments = attachments.map(att => ({
        filename: att.file.name,
        mimeType: att.file.type || 'application/octet-stream',
        content: att.base64,
      }));

      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          to: mail!.fromEmail || mail!.from,
          subject: `Re: ${mail!.subject}`,
          body: reply,
          replyToEmailId: mail!.id,
          attachments: emailAttachments.length > 0 ? emailAttachments : undefined,
        },
        headers: { Authorization: `Bearer ${session.session?.access_token}` },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({ title: "✅ Email verzonden", description: "Je antwoord is succesvol verzonden." });
      setReply('');
      setIsEditingReply(false);
      setAttachments([]);
    } catch (error: any) {
      toast({ title: "Verzenden mislukt", description: error.message || "Probeer het opnieuw.", variant: "destructive" });
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

  return (
    <ErrorBoundary>
      <div className={`bg-background overflow-y-auto overflow-x-hidden max-w-full ${className}`}>
        <div className="p-4 sm:p-8 space-y-5 max-w-full">
        {/* Subject header */}
        <div className="pb-5 border-b border-border/60">
          <h1 className="text-[22px] font-bold text-foreground tracking-tight mb-3 leading-tight">
            {mail.subject}
          </h1>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 space-y-1">
              <div className="text-[14px]">
                <span className="font-semibold text-foreground">{mail.from}</span>
              </div>
              <div className="text-[13px] text-muted-foreground">
                Aan: <span className="text-foreground/70">{mail.to.join(', ')}</span>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
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
          <Card className="shadow-card border-primary/20">
            <CardContent className="p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <Brain className="h-5 w-5 text-primary flex-shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium text-foreground">AI analyse</p>
                  <p className="text-xs text-muted-foreground">Klik om deze email te analyseren met AI</p>
                </div>
              </div>
              <Button size="sm" onClick={analyzeCurrentMail}>
                <Sparkles className="h-4 w-4 mr-2" />Analyseer
              </Button>
            </CardContent>
          </Card>
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
                        <Badge variant="outline" className={`text-sm font-medium border-2 ${getCategoryClassName(analysis.category)}`}>
                          {analysis.category}
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

        {/* AI Reply Suggestion */}
        <Card className="relative overflow-hidden bg-primary/[0.04] animate-page-in">
          <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-primary" />
          <CardHeader className="pb-3 p-5 pl-6">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <CardTitle className="text-[16px] font-semibold flex items-center text-foreground">
                <Sparkles className="h-4 w-4 mr-2 text-primary" />
                AI suggestie
              </CardTitle>
              <div className="flex items-center gap-2">
                <Select value={tone} onValueChange={(value) => setTone(value as ToneOfVoice)}>
                  <SelectTrigger className="w-32 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Neutraal">Neutraal</SelectItem>
                    <SelectItem value="Empathisch">Empathisch</SelectItem>
                    <SelectItem value="Formeel">Formeel</SelectItem>
                    <SelectItem value="Vrolijk">Vrolijk</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={generateAiReply}
                  disabled={isGeneratingReply}
                >
                  <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isGeneratingReply ? 'animate-spin' : ''}`} />
                  Vernieuw
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-5 pl-6 pt-0">
            {isGeneratingReply ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-32 w-full" />
              </div>
            ) : (
              <Textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                readOnly={!isEditingReply}
                className={`min-h-48 resize-none text-base shadow-subtle ${!isEditingReply ? 'bg-muted/50' : 'bg-background'}`}
                placeholder="AI genereert hier een antwoord..."
              />
            )}
            {/* Attachment section */}
            <div className="space-y-2 mt-3">
              <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileSelect} />
              <Button variant="outline" size="sm" type="button" onClick={() => fileInputRef.current?.click()}>
                <Paperclip className="h-4 w-4 mr-2" />Bijlage toevoegen
              </Button>
              {attachments.length > 0 && (
                <div className="space-y-1">
                  {attachments.map((att, index) => (
                    <div key={index} className="flex items-center justify-between bg-muted rounded-md px-3 py-2 text-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="truncate">{att.file.name}</span>
                        <span className="text-muted-foreground text-xs flex-shrink-0">({formatFileSize(att.file.size)})</span>
                      </div>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive" onClick={() => removeAttachment(index)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 sm:flex sm:space-x-4 gap-2 sm:gap-0 pt-2">
          <Button 
            onClick={handleSendReply}
            size="lg"
            className="flex-1 bg-success text-success-foreground hover:bg-success/90 shadow-card hover:shadow-elevated transition-all duration-200 font-semibold py-6"
            disabled={isGeneratingReply || !reply.trim()}
          >
            <Send className="h-5 w-5 mr-2" />
            Verstuur 
          </Button>
          
          <Button 
            variant={isEditingReply ? "default" : "outline"}
            onClick={() => setIsEditingReply(!isEditingReply)}
            size="lg"
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 shadow-card hover:shadow-elevated transition-all duration-200 font-semibold py-6"
            disabled={isGeneratingReply}
          >
            <Edit className="h-5 w-5 mr-2" />
            {isEditingReply ? 'Klaar met bewerken' : 'Aanpassen'}
          </Button>
          
          <Button 
            variant="outline" 
            onClick={handleMarkAsResolved}
            size="lg"
            className="flex-1 bg-muted text-muted-foreground hover:bg-muted/80 shadow-card hover:shadow-elevated transition-all duration-200 font-semibold py-6"
          >
            <CheckCircle2 className="h-5 w-5 mr-2" />
            Afgehandeld
          </Button>

          <Button 
            variant="outline" 
            onClick={() => {
              const blocked = JSON.parse(localStorage.getItem('servio_blocked_senders') || '[]');
              const sender = mail.from;
              if (!blocked.includes(sender)) {
                blocked.push(sender);
                localStorage.setItem('servio_blocked_senders', JSON.stringify(blocked));
              }
              toast({ title: "🚫 Afzender geblokkeerd", description: `${sender} is gemarkeerd als phishing en geblokkeerd.` });
            }}
            size="lg"
            className="bg-destructive/10 text-destructive hover:bg-destructive/20 shadow-card hover:shadow-elevated transition-all duration-200 font-semibold py-6"
          >
            <ShieldAlert className="h-5 w-5 mr-2" />
            Phishing
          </Button>
        </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}