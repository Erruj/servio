import { useState, useEffect, useRef } from 'react';
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
  Archive,
  Users,
  Heart,
  FileText,
  AlertTriangle,
  Paperclip,
  FileIcon,
  Trash2
} from 'lucide-react';
import { detectFaq, addAiLog, getAiLogs } from '@/lib/ai';
import { generateSmartReplies, getLocalizedErrorMessage, AiError } from '@/lib/ai/orchestrator';
import type { ReplyVariant } from '@/lib/ai/providers';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

// Using ReplyVariant from providers instead of local interface

interface EnhancedReplyEditorProps {
  mail: MailItem | null;
  analysis: AnalysisResult | null;
  className?: string;
}

export function EnhancedReplyEditor({ mail, analysis, className }: EnhancedReplyEditorProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'ai' | 'manual'>('ai');
  const [aiSuggestions, setAiSuggestions] = useState<ReplyVariant[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState<ReplyVariant | null>(null);
  const [customReply, setCustomReply] = useState('');
  const [manualReply, setManualReply] = useState('');
  const [tone, setTone] = useState<ToneOfVoice>('Neutraal');
  const [language, setLanguage] = useState<Language>('NL');
  const [isGenerating, setIsGenerating] = useState(false);
  const [faqSuggestion, setFaqSuggestion] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [canRetry, setCanRetry] = useState(false);
  const { toast } = useToast();

  // Auto-generate suggestions when mail or analysis changes
  useEffect(() => {
    if (mail && analysis) {
      generateAiSuggestions();
      checkForFaq();
    } else {
      setAiSuggestions([]);
      setSelectedSuggestion(null);
      setCustomReply('');
      setManualReply('');
      setFaqSuggestion(null);
    }
  }, [mail, analysis]);

  const generateAiSuggestions = async () => {
    if (!mail) return;

    setIsGenerating(true);
    setLastError(null);
    setCanRetry(false);

    try {
      const result = await generateSmartReplies({
        mail,
        tone: tone || 'Zakelijk',
        language: language || 'NL',
        analysis
      });

      if (result.success && result.variants) {
        setAiSuggestions(result.variants);
        setSelectedSuggestion(result.variants[0]);
        setCustomReply(result.variants[0].content);
        setCanRetry(false);
      }
    } catch (error) {
      console.error('Reply generation failed:', error);
      
      if (error instanceof AiError) {
        setLastError(getLocalizedErrorMessage(error.code, language));
        setCanRetry(error.code !== 'BAD_INPUT'); // Don't retry bad input
      } else {
        setLastError(t('replyEditor.errors.unknown'));
        setCanRetry(true);
      }
      
      // Generate fallback replies as ultimate fallback
      handleUseFallbackReplies();
    } finally {
      setIsGenerating(false);
    }
  };

  const regenerateAiSuggestions = async () => {
    if (!mail || !analysis) return;
    
    // Clear error state
    setLastError(null);
    setCanRetry(false);
    
    // Just call generateAiSuggestions again for simplicity
    await generateAiSuggestions();
  };

  const handleRetryGeneration = async () => {
    await generateAiSuggestions();
  };

  const handleUseFallbackReplies = () => {
    if (!mail) return;

    const customerName = mail.from.split(' ')[0] || 'klant';
    const fallbackSuggestions: ReplyVariant[] = [
      {
        type: 'Zakelijk',
        label: 'Zakelijk',
        content: `Beste ${customerName},\n\nBedankt voor je bericht. We pakken dit direct voor je op.\n\nMet vriendelijke groet`,
        icon: '💼'
      },
      {
        type: 'Empathisch',
        label: 'Empathisch',
        content: `Beste ${customerName},\n\nIk begrijp je situatie en dank je voor je geduld. We helpen je graag verder.\n\nHartelijke groet`,
        icon: '💝'
      },
      {
        type: 'Uitgebreid',
        label: 'Uitgebreid',
        content: `Geachte ${customerName},\n\nWij hebben uw verzoek in goede orde ontvangen en zullen dit zorgvuldig behandelen.\n\nWe streven ernaar binnen 24 uur te reageren.\n\nHoogachtend`,
        icon: '📋'
      }
    ];
    
    setAiSuggestions(fallbackSuggestions);
    setSelectedSuggestion(fallbackSuggestions[0]);
    setCustomReply(fallbackSuggestions[0].content);
    setLastError(null);

    toast({
      title: t('replyEditor.usingFallbackReplies'),
      description: t('replyEditor.fallbackRepliesActivated'),
    });
  };

  const checkForFaq = () => {
    if (!mail) return;
    
    const faqKey = detectFaq(mail);
    setFaqSuggestion(faqKey);
  };

  const handleSuggestionSelect = (suggestion: ReplyVariant) => {
    setSelectedSuggestion(suggestion);
    setCustomReply(suggestion.content);
  };

  const handleSend = async () => {
    const currentReply = activeTab === 'ai' ? customReply : manualReply;
    
    if (!currentReply.trim() || !mail) {
      toast({
        title: "Geen inhoud",
        description: "Voeg eerst inhoud toe aan je antwoord.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: session } = await supabase.auth.getSession();

      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          to: mail.from,
          subject: `Re: ${mail.subject}`,
          body: currentReply,
          replyToEmailId: mail.id,
        },
        headers: {
          Authorization: `Bearer ${session.session?.access_token}`,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({
        title: "✅ E-mail verzonden",
        description: "Je antwoord is succesvol verzonden.",
      });

      setAiSuggestions([]);
      setSelectedSuggestion(null);
      setCustomReply('');
      setManualReply('');
    } catch (err: any) {
      console.error('Send error:', err);
      toast({
        title: "Verzenden mislukt",
        description: err.message || "Probeer het opnieuw.",
        variant: "destructive"
      });
    }
  };

  const handleSaveAsDraft = () => {
    const currentReply = activeTab === 'ai' ? customReply : manualReply;
    
    if (!currentReply.trim()) {
      toast({
        title: "No content",
        description: "There is no content to save.",
        variant: "destructive"
      });
      return;
    }

    // Mock save functionality
    toast({
      title: "Draft saved",
      description: "Your reply has been saved as a draft."
    });
  };

  const handleMarkAsResolved = () => {
    toast({
      title: "Email resolved",
      description: "The email has been marked as resolved."
    });
  };

  if (!mail) {
    return (
      <div className={`bg-card border-l border-border ${className}`}>
        <div className="p-6 text-center text-muted-foreground">
          <Send className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>{t('selectEmail')}</p>
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
            {t('reply')}
          </h3>
          
          {faqSuggestion && (
            <Badge variant="secondary" className="bg-primary/10 text-primary animate-pulse">
              Auto-reply possible
            </Badge>
          )}
        </div>

        {/* Settings */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Tone</label>
            <Select value={tone} onValueChange={(value) => setTone(value as ToneOfVoice)}>
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Neutraal">Neutral</SelectItem>
                <SelectItem value="Empathisch">Empathetic</SelectItem>
                <SelectItem value="Formeel">Formal</SelectItem>
                <SelectItem value="Vrolijk">Cheerful</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Language</label>
            <Select value={language} onValueChange={(value) => setLanguage(value as Language)}>
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NL">{t('dutch')}</SelectItem>
                <SelectItem value="EN">{t('english')}</SelectItem>
                <SelectItem value="DE">{t('german')}</SelectItem>
                <SelectItem value="FR">{t('french')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Reply content */}
      <div className="flex-1 p-4">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'ai' | 'manual')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="ai" className="flex items-center">
              <Sparkles className="h-4 w-4 mr-2" />
              AI Suggestions
            </TabsTrigger>
            <TabsTrigger value="manual">Manual</TabsTrigger>
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
                {/* AI Suggestion Selector */}
                {aiSuggestions.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium">Choose response style:</h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={regenerateAiSuggestions}
                        disabled={isGenerating}
                      >
                        <RefreshCw className={`h-4 w-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
                        {isGenerating ? t('generating') : t('regenerate')}
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2">
                      {aiSuggestions.map((suggestion) => (
                        <Button
                          key={suggestion.type}
                          variant={selectedSuggestion?.type === suggestion.type ? "default" : "outline"}
                          size="sm"
                          className="flex items-center justify-center text-xs"
                          onClick={() => handleSuggestionSelect(suggestion)}
                        >
                          <span className="mr-1">{suggestion.icon}</span>
                          <span>{suggestion.label}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
                
                <Textarea
                  value={customReply}
                  onChange={(e) => setCustomReply(e.target.value)}
                  placeholder={isGenerating ? t('generatingReplies') : t('aiSuggestionsPlaceholder')}
                  className="min-h-48 resize-none"
                  disabled={isGenerating}
                />

                {/* Error handling UI */}
                {lastError && canRetry && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-2">
                        <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-destructive">
                            {t('replyEditor.errors.generationFailed')}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {lastError}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2 mt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleRetryGeneration}
                        disabled={isGenerating}
                      >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        {t('replyEditor.actions.tryAgain')}
                      </Button>
                      {aiSuggestions.length === 0 && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={handleUseFallbackReplies}
                        >
                          <Sparkles className="h-3 w-3 mr-1" />
                          {t('replyEditor.actions.useFallbackReply')}
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="manual">
            <Textarea
              value={manualReply}
              onChange={(e) => setManualReply(e.target.value)}
              placeholder="Type your own response here..."
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
            {t('send')}
          </Button>
          
          <Button 
            variant="outline"
            onClick={handleSaveAsDraft}
            disabled={isGenerating}
          >
            <Save className="h-4 w-4 mr-2" />
            {t('draft')}
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
            {t('markAsResolved')}
          </Button>
          
          <Button variant="outline" size="sm">
            <Clock className="h-4 w-4 mr-2" />
            {t('later')}
          </Button>
          
          <Button variant="outline" size="sm">
            <Archive className="h-4 w-4 mr-2" />
            {t('archive')}
          </Button>
        </div>

        {/* FAQ suggestion */}
        {faqSuggestion && (
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Sparkles className="h-4 w-4 text-primary mr-2" />
                <span className="text-sm font-medium text-primary">
                  Auto-reply available
                </span>
              </div>
              <Button size="sm" variant="default">
                Confirm
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              This looks like a frequently asked question. Automatic response available.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}