import { useState, useEffect } from 'react';
import { MailItem, AnalysisResult, ToneOfVoice, Language } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Send, 
  RefreshCw, 
  Save, 
  CheckCircle2, 
  Sparkles,
  Clock,
  Archive
} from 'lucide-react';
import { generateReply, regenerateReply, detectFaq } from '@/lib/ai';
import { useToast } from '@/hooks/use-toast';
import { HelpTooltip } from '@/components/HelpTooltip';

interface ReplyEditorProps {
  mail: MailItem | null;
  analysis: AnalysisResult | null;
  className?: string;
}

export function ReplyEditor({ mail, analysis, className }: ReplyEditorProps) {
  const [activeTab, setActiveTab] = useState<'ai' | 'manual'>('ai');
  const [aiReply, setAiReply] = useState('');
  const [manualReply, setManualReply] = useState('');
  const [tone, setTone] = useState<ToneOfVoice>('Neutraal');
  const [language, setLanguage] = useState<Language>('NL');
  const [isGenerating, setIsGenerating] = useState(false);
  const [faqSuggestion, setFaqSuggestion] = useState<string | null>(null);
  const { toast } = useToast();

  // Auto-generate reply when mail or analysis changes
  useEffect(() => {
    if (mail && analysis) {
      generateAiReply();
      checkForFaq();
    } else {
      setAiReply('');
      setManualReply('');
      setFaqSuggestion(null);
    }
  }, [mail, analysis]);

  const generateAiReply = async () => {
    if (!mail || !analysis) return;

    setIsGenerating(true);
    try {
      const reply = await generateReply({
        mail,
        analysis,
        tone,
        language
      });
      setAiReply(reply);
    } catch (error) {
      toast({
        title: "Fout",
        description: "Kon geen AI-antwoord genereren. Probeer opnieuw.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const regenerateAiReply = async () => {
    if (!mail || !analysis) return;

    setIsGenerating(true);
    try {
      const reply = await regenerateReply({
        mail,
        analysis,
        tone,
        language
      });
      setAiReply(reply);
      toast({
        title: "Nieuw antwoord gegenereerd",
        description: "Het AI-antwoord is vernieuwd met een andere formulering."
      });
    } catch (error) {
      toast({
        title: "Fout",
        description: "Kon geen nieuw antwoord genereren. Probeer opnieuw.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const checkForFaq = () => {
    if (!mail) return;
    
    const faqKey = detectFaq(mail);
    setFaqSuggestion(faqKey);
  };

  const handleSend = async () => {
    const currentReply = activeTab === 'ai' ? aiReply : manualReply;
    
    if (!currentReply.trim()) {
      toast({
        title: "Geen inhoud",
        description: "Voeg eerst inhoud toe aan je antwoord.",
        variant: "destructive"
      });
      return;
    }

    // Mock send functionality
    toast({
      title: "Email verzonden",
      description: "Je antwoord is succesvol verzonden naar de klant.",
    });

    // Clear the editor
    setAiReply('');
    setManualReply('');
  };

  const handleSaveAsDraft = () => {
    const currentReply = activeTab === 'ai' ? aiReply : manualReply;
    
    if (!currentReply.trim()) {
      toast({
        title: "Geen inhoud",
        description: "Er is geen inhoud om op te slaan.",
        variant: "destructive"
      });
      return;
    }

    // Mock save functionality
    toast({
      title: "Concept opgeslagen",
      description: "Je antwoord is opgeslagen als concept."
    });
  };

  const handleMarkAsResolved = () => {
    toast({
      title: "Email afgehandeld",
      description: "De email is gemarkeerd als afgehandeld."
    });
  };

  if (!mail) {
    return (
      <div className={`bg-card border-l border-border ${className}`}>
        <div className="p-6 text-center text-muted-foreground">
          <Send className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Selecteer een email om te antwoorden</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-card border-l border-border flex flex-col ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center">
            <Send className="h-5 w-5 mr-2 text-primary" />
            Antwoord
          </h3>
          
          {faqSuggestion && (
            <Badge variant="secondary" className="bg-primary/10 text-primary animate-pulse">
              Auto-reply mogelijk
            </Badge>
          )}
        </div>

        {/* Settings */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Toon</label>
            <Select value={tone} onValueChange={(value) => setTone(value as ToneOfVoice)}>
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Neutraal">Neutraal</SelectItem>
                <SelectItem value="Empathisch">Empathisch</SelectItem>
                <SelectItem value="Formeel">Formeel</SelectItem>
                <SelectItem value="Vrolijk">Vrolijk</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Taal</label>
            <Select value={language} onValueChange={(value) => setLanguage(value as Language)}>
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NL">Nederlands</SelectItem>
                <SelectItem value="EN">English</SelectItem>
                <SelectItem value="DE">Deutsch</SelectItem>
                <SelectItem value="FR">Français</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Reply content */}
      <div className="flex-1 p-4">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'ai' | 'manual')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="ai" className="flex items-center gap-1">
              <Sparkles className="h-4 w-4 mr-1" />
              AI-voorstel
              <HelpTooltip
                tipKey="ai-suggestion"
                title="AI-voorstel"
                text="AI genereert automatisch een antwoord op basis van de emailinhoud. Je kunt het altijd nog aanpassen voor verzenden."
                className="ml-1"
              />
            </TabsTrigger>
            <TabsTrigger value="manual">Handmatig</TabsTrigger>
          </TabsList>

          <TabsContent value="ai" className="space-y-4">
            {isGenerating ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-32 w-full" />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={regenerateAiReply}
                    disabled={isGenerating || !analysis}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Regenereer
                  </Button>
                </div>
                
                <Textarea
                  value={aiReply}
                  onChange={(e) => setAiReply(e.target.value)}
                  placeholder="AI genereert hier een antwoord..."
                  className="min-h-48 resize-none"
                />
              </>
            )}
          </TabsContent>

          <TabsContent value="manual">
            <Textarea
              value={manualReply}
              onChange={(e) => setManualReply(e.target.value)}
              placeholder="Typ hier je eigen antwoord..."
              className="min-h-48 resize-none"
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-border space-y-3">
        {/* Primary actions */}
        <div className="flex space-x-2">
          <Button 
            onClick={handleSend}
            className="flex-1"
            disabled={isGenerating}
          >
            <Send className="h-4 w-4 mr-2" />
            Verstuur
          </Button>
          
          <Button 
            variant="outline"
            onClick={handleSaveAsDraft}
            disabled={isGenerating}
          >
            <Save className="h-4 w-4 mr-2" />
            Concept
          </Button>
        </div>

        {/* Secondary actions */}
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleMarkAsResolved}
            className="flex-1"
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Markeer als afgehandeld
          </Button>
          
          <Button variant="outline" size="sm">
            <Clock className="h-4 w-4 mr-2" />
            Later
          </Button>
          
          <Button variant="outline" size="sm">
            <Archive className="h-4 w-4 mr-2" />
            Archiveer
          </Button>
        </div>

        {/* FAQ suggestion */}
        {faqSuggestion && (
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Sparkles className="h-4 w-4 text-primary mr-2" />
                <span className="text-sm font-medium text-primary">
                  Auto-reply beschikbaar
                </span>
              </div>
              <Button size="sm" variant="default">
                Bevestigen
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Dit lijkt een veelgestelde vraag. Automatisch antwoord mogelijk.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}