import { useState, useEffect } from 'react';
import { MailItem, AnalysisResult, ToneOfVoice, Language } from '@/types';
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
  Mail as MailIcon
} from 'lucide-react';
import { analyzeEmail, generateReply } from '@/lib/ai';
import { useToast } from '@/hooks/use-toast';

interface MailDetailProps {
  mail: MailItem | null;
  className?: string;
}

export function MailDetail({ mail, className }: MailDetailProps) {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [reply, setReply] = useState('');
  const [isGeneratingReply, setIsGeneratingReply] = useState(false);
  const [isEditingReply, setIsEditingReply] = useState(false);
  const [tone, setTone] = useState<ToneOfVoice>('Neutraal');
  const [language, setLanguage] = useState<Language>('NL');
  const { toast } = useToast();

  // Auto-analyze when mail changes
  useEffect(() => {
    if (mail) {
      analyzeCurrentMail();
    } else {
      setAnalysis(null);
      setReply('');
    }
  }, [mail]);

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
      console.error('Analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateAiReply = async () => {
    if (!mail || !analysis) return;

    setIsGeneratingReply(true);
    try {
      const generatedReply = await generateReply({
        mail,
        analysis,
        tone,
        language
      });
      setReply(generatedReply);
    } catch (error) {
      console.error('Reply generation error:', error);
    } finally {
      setIsGeneratingReply(false);
    }
  };

  const handleSendReply = () => {
    if (!reply.trim()) {
      toast({
        title: "Geen inhoud",
        description: "Voeg eerst inhoud toe aan je antwoord.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "✅ Email verzonden",
      description: "Je antwoord is succesvol verzonden naar de klant.",
    });

    // Clear state
    setReply('');
    setIsEditingReply(false);
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
            <div className="bg-secondary/30 rounded-xl p-4">
              <div className="whitespace-pre-wrap text-foreground leading-relaxed">
                {mail.body}
              </div>
            </div>
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
                  <Badge 
                    variant="outline" 
                    className={`text-sm font-medium border-2 ${getCategoryClassName(analysis.category)}`}
                  >
                    {analysis.category}
                  </Badge>
                </CardContent>
              </Card>

              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="text-lg">⚡ Urgentie</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge 
                    className={`text-sm font-medium ${getUrgencyClassName(analysis.urgency)}`}
                  >
                    {analysis.urgency}
                  </Badge>
                </CardContent>
              </Card>
            </div>
          </>
        )}

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
            <p className="text-sm text-muted-foreground mt-2 bg-white/50 p-3 rounded-lg">
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
                className={`min-h-48 resize-none text-base shadow-subtle ${!isEditingReply ? 'bg-white/70' : 'bg-white'}`}
                placeholder="AI genereert hier een antwoord..."
              />
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex space-x-4 pt-2">
          <Button 
            onClick={handleSendReply}
            size="lg"
            className="flex-1 bg-green-600 text-white hover:bg-green-700 shadow-card hover:shadow-elevated transition-all duration-200 font-semibold py-6"
            disabled={isGeneratingReply || !reply.trim()}
          >
            <Send className="h-5 w-5 mr-2" />
            Verstuur 
          </Button>
          
          <Button 
            variant={isEditingReply ? "default" : "outline"}
            onClick={() => setIsEditingReply(!isEditingReply)}
            size="lg"
            className="flex-1 bg-blue-600 text-white hover:bg-blue-700 shadow-card hover:shadow-elevated transition-all duration-200 font-semibold py-6"
            disabled={isGeneratingReply}
          >
            <Edit className="h-5 w-5 mr-2" />
            {isEditingReply ? 'Klaar met bewerken' : 'Aanpassen'}
          </Button>
          
          <Button 
            variant="outline" 
            onClick={handleMarkAsResolved}
            size="lg"
            className="flex-1 bg-gray-500 text-white hover:bg-gray-600 shadow-card hover:shadow-elevated transition-all duration-200 font-semibold py-6"
          >
            <CheckCircle2 className="h-5 w-5 mr-2" />
            Markeer als afgehandeld
          </Button>
        </div>
      </div>
    </div>
  );
}