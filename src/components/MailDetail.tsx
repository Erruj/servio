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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Reset all state when mail changes
  useEffect(() => {
    if (mail) {
      setReply('');
      setAnalysis(null);
      setIsEditingReply(false);
      setAttachments([]);
      analyzeCurrentMail();
    } else {
      setAnalysis(null);
      setReply('');
    }
  }, [mail?.id]);

  // Auto-generate reply when analysis is complete
  useEffect(() => {
    if (mail && analysis && !reply) {
      generateAiReply();
    }
  }, [mail, analysis]);

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
          to: mail!.from,
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

  return (
    <ErrorBoundary>
      <div className={`bg-background overflow-y-auto ${className}`}>
        <div className="p-6 space-y-6">
        {/* Header */}
        <div className="border-b border-border pb-4">
          <h1 className="text-2xl font-bold text-foreground mb-2 flex items-center">
            📧 Inkomende mail
          </h1>
          <p className="text-muted-foreground">
            Bekijk en beantwoord deze support email
          </p>
        </div>

        {/* Email Content Card */}
        <Card className="shadow-card">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between mb-4">
              <CardTitle className="text-xl">{mail.subject}</CardTitle>
              {mail.unread && (
                <Badge variant="default" className="bg-primary">
                  Nieuw
                </Badge>
              )}
            </div>

            {/* Email metadata */}
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-muted-foreground">Van: </span>
                  <span className="font-medium text-foreground">{mail.from}</span>
                </div>
                <span className="text-muted-foreground" title={fullDate}>
                  {timeAgo}
                </span>
              </div>
              
              <div>
                <span className="text-muted-foreground">Aan: </span>
                <span className="font-medium text-foreground">{mail.to.join(', ')}</span>
              </div>

              {mail.attachments && mail.attachments.length > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="text-muted-foreground">Bijlagen: </span>
                  <div className="flex flex-wrap gap-2">
                    {mail.attachments.map((attachment, index) => (
                      <div 
                        key={index}
                        className="flex items-center space-x-1 bg-secondary rounded-lg px-3 py-1 shadow-subtle"
                      >
                        <Paperclip className="h-3 w-3" />
                        <span className="text-xs font-medium">{attachment.name}</span>
                        {attachment.sizeKB && (
                          <span className="text-xs text-muted-foreground">
                            ({attachment.sizeKB}KB)
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent>
            <EmailBodyRenderer
              bodyHtml={mail.bodyHtml}
              bodyText={mail.bodyText || mail.body}
            />
          </CardContent>
        </Card>

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
                  <Select value={analysis.category} onValueChange={(val) => setAnalysis(prev => prev ? { ...prev, category: val as any } : prev)}>
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

        {/* AI Reply Suggestion - Prominent Section */}
        <Card className="shadow-elevated border-primary/20 bg-gradient-to-br from-primary/8 to-accent/8 ring-1 ring-primary/10">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-bold flex items-center text-primary">
                <Sparkles className="h-6 w-6 mr-3 text-primary animate-pulse" />
                🤖 AI Suggestie Antwoord
              </CardTitle>
              <div className="flex items-center space-x-3">
                <Select value={tone} onValueChange={(value) => setTone(value as ToneOfVoice)}>
                  <SelectTrigger className="w-32 shadow-subtle">
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
                  className="shadow-subtle"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isGeneratingReply ? 'animate-spin' : ''}`} />
                  Vernieuw
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-2 bg-secondary/50 p-3 rounded-lg">
              De AI heeft dit antwoord gegenereerd op basis van de email-inhoud en je bedrijfsrichtlijnen.
            </p>
          </CardHeader>
          <CardContent>
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
        <div className="flex space-x-4 pt-2">
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