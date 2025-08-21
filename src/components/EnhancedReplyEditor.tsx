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
  Archive,
  Users,
  Heart,
  FileText,
  AlertTriangle
} from 'lucide-react';
import { safeGenerateReply, detectFaq, AI_ERROR_CODES, type AiErrorCode } from '@/lib/ai';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

interface AiSuggestion {
  type: 'business' | 'empathetic' | 'formal';
  label: string;
  content: string;
  icon: React.ReactNode;
}

interface EnhancedReplyEditorProps {
  mail: MailItem | null;
  analysis: AnalysisResult | null;
  className?: string;
}

export function EnhancedReplyEditor({ mail, analysis, className }: EnhancedReplyEditorProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'ai' | 'manual'>('ai');
  const [aiSuggestions, setAiSuggestions] = useState<AiSuggestion[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState<AiSuggestion | null>(null);
  const [customReply, setCustomReply] = useState('');
  const [manualReply, setManualReply] = useState('');
  const [tone, setTone] = useState<ToneOfVoice>('Neutraal');
  const [language, setLanguage] = useState<Language>('NL');
  const [isGenerating, setIsGenerating] = useState(false);
  const [faqSuggestion, setFaqSuggestion] = useState<string | null>(null);
  const [lastError, setLastError] = useState<{ code: AiErrorCode; message: string } | null>(null);
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
    if (!mail || !analysis) return;

    setIsGenerating(true);
    setLastError(null);
    setCanRetry(false);
    
    try {
      // Use the robust generation function
      const result = await safeGenerateReply({
        mail,
        analysis,
        tone: 'Neutraal',
        language
      });

      if (result.success && result.suggestions) {
        const suggestions: AiSuggestion[] = [
          {
            type: 'business',
            label: t('business'),
            content: result.suggestions[0],
            icon: <Users className="h-4 w-4" />
          },
          {
            type: 'empathetic', 
            label: t('empathetic'),
            content: result.suggestions[1] || result.suggestions[0],
            icon: <Heart className="h-4 w-4" />
          },
          {
            type: 'formal',
            label: t('detailed'),
            content: result.suggestions[2] || result.suggestions[0],
            icon: <FileText className="h-4 w-4" />
          }
        ];

        setAiSuggestions(suggestions);
        setSelectedSuggestion(suggestions[0]);
        setCustomReply(suggestions[0].content);

        if (!result.success && result.error) {
          // Show success with fallback notice
          toast({
            title: t('usingDemoReplies'),
            description: result.error.message,
            variant: "default"
          });
        }
      } else if (result.error) {
        // Error with fallback suggestions
        setLastError(result.error);
        setCanRetry(true);
        
        if (result.suggestions && result.suggestions.length > 0) {
          const fallbackSuggestions: AiSuggestion[] = [
            {
              type: 'business',
              label: t('business') + ' (demo)',
              content: result.suggestions[0],
              icon: <Users className="h-4 w-4" />
            },
            {
              type: 'empathetic',
              label: t('empathetic') + ' (demo)',
              content: result.suggestions[1] || result.suggestions[0],
              icon: <Heart className="h-4 w-4" />
            },
            {
              type: 'formal',
              label: t('detailed') + ' (demo)',
              content: result.suggestions[2] || result.suggestions[0],
              icon: <FileText className="h-4 w-4" />
            }
          ];

          setAiSuggestions(fallbackSuggestions);
          setSelectedSuggestion(fallbackSuggestions[0]);
          setCustomReply(fallbackSuggestions[0].content);
        }

        toast({
          title: t('aiGenerationFailed'),
          description: result.error.message,
          variant: "destructive"
        });
      }
      
    } catch (error) {
      setLastError({
        code: 'UNKNOWN',
        message: t('unexpectedError')
      });
      setCanRetry(true);
      
      toast({
        title: t('error'),
        description: t('unexpectedError'),
        variant: "destructive"
      });
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

  const handleUseDemoReplies = () => {
    // Force demo mode by using the fallback suggestions
    toast({
      title: t('usingDemoReplies'),
      description: t('demoRepliesActivated'),
    });
  };

  const checkForFaq = () => {
    if (!mail) return;
    
    const faqKey = detectFaq(mail);
    setFaqSuggestion(faqKey);
  };

  const handleSuggestionSelect = (suggestion: AiSuggestion) => {
    setSelectedSuggestion(suggestion);
    setCustomReply(suggestion.content);
  };

  const handleSend = async () => {
    const currentReply = activeTab === 'ai' ? customReply : manualReply;
    
    if (!currentReply.trim()) {
      toast({
        title: "No content",
        description: "Please add content to your reply first.",
        variant: "destructive"
      });
      return;
    }

    // Mock send functionality
    toast({
      title: "Email sent",
      description: "Your reply has been successfully sent to the customer.",
    });

    // Clear the editor
    setAiSuggestions([]);
    setSelectedSuggestion(null);
    setCustomReply('');
    setManualReply('');
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
                          {suggestion.icon}
                          <span className="ml-1">{suggestion.label}</span>
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
                            {t('aiGenerationFailed')}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {lastError.message}
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
                        {t('tryAgain')}
                      </Button>
                      {aiSuggestions.length === 0 && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={handleUseDemoReplies}
                        >
                          <Sparkles className="h-3 w-3 mr-1" />
                          {t('useDemoReply')}
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