import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Send, Brain, TrendingUp, FileText, Tag, History, Lightbulb, Loader2, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AdminBreadcrumb } from '@/components/AdminBreadcrumb';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  actions?: AIAction[];
  metadata?: any;
}

interface AIAction {
  type: 'link_invoice' | 'change_category' | 'group_costs' | 'view_details';
  label: string;
  data: any;
  completed?: boolean;
}

interface ConversationSummary {
  id: string;
  date: Date;
  summary: string;
  messageCount: number;
}

export default function AIAssistant() {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<ConversationSummary[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [sessionSummary, setSessionSummary] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    loadConversationHistory();
  }, []);

  const loadConversationHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_insights')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (!error && data) {
        // Group by date
        const grouped = data.reduce((acc: Record<string, any[]>, item) => {
          const date = new Date(item.created_at).toDateString();
          if (!acc[date]) acc[date] = [];
          acc[date].push(item);
          return acc;
        }, {});

        const summaries: ConversationSummary[] = Object.entries(grouped).map(([date, items]) => ({
          id: date,
          date: new Date(date),
          summary: items[0].query?.substring(0, 50) + '...' || 'Gesprek',
          messageCount: items.length
        }));

        setConversationHistory(summaries);
      }
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: { 
          query: input, 
          conversationHistory: messages.map(m => ({ role: m.role, content: m.content })),
          enableActions: true
        },
      });

      if (error) throw error;

      // Parse AI actions from response
      const actions: AIAction[] = [];
      const answer = data.answer || '';
      
      // Detect actionable items in the response
      if (answer.toLowerCase().includes('factuur') || answer.toLowerCase().includes('invoice')) {
        actions.push({
          type: 'link_invoice',
          label: 'Bekijk gerelateerde facturen',
          data: { query: input }
        });
      }
      if (answer.toLowerCase().includes('categorie') || answer.toLowerCase().includes('category')) {
        actions.push({
          type: 'change_category',
          label: 'Categorieën aanpassen',
          data: {}
        });
      }
      if (data.metadata?.categoryBreakdown && Object.keys(data.metadata.categoryBreakdown).length > 0) {
        actions.push({
          type: 'view_details',
          label: 'Bekijk kostendetails',
          data: data.metadata
        });
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: answer,
        timestamp: new Date(),
        actions: actions.length > 0 ? actions : undefined,
        metadata: data.metadata
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Check for follow-up suggestions
      if (data.followUp) {
        setTimeout(() => {
          const followUpMessage: Message = {
            role: 'assistant',
            content: data.followUp,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, followUpMessage]);
        }, 1500);
      }

      // Save to insights
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('ai_insights').insert({
          user_id: user.id,
          type: 'question',
          query: input,
          answer: answer,
          metadata: data.metadata || {},
        });
      }

      // Update session summary
      if (messages.length > 2) {
        updateSessionSummary([...messages, userMessage, assistantMessage]);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error(t('aiAssistantError'));
    } finally {
      setLoading(false);
    }
  };

  const updateSessionSummary = (allMessages: Message[]) => {
    const topics = new Set<string>();
    allMessages.forEach(m => {
      if (m.content.toLowerCase().includes('uitgaven') || m.content.toLowerCase().includes('kosten')) topics.add('kosten');
      if (m.content.toLowerCase().includes('omzet') || m.content.toLowerCase().includes('inkomsten')) topics.add('omzet');
      if (m.content.toLowerCase().includes('btw') || m.content.toLowerCase().includes('vat')) topics.add('btw');
      if (m.content.toLowerCase().includes('factuur')) topics.add('facturen');
    });
    
    if (topics.size > 0) {
      setSessionSummary(`Besproken: ${Array.from(topics).join(', ')}`);
    }
  };

  const executeAction = async (action: AIAction, messageIndex: number) => {
    toast.success(`${action.label} wordt uitgevoerd...`);
    
    // Mark action as completed
    setMessages(prev => prev.map((m, i) => {
      if (i === messageIndex && m.actions) {
        return {
          ...m,
          actions: m.actions.map(a => 
            a.type === action.type ? { ...a, completed: true } : a
          )
        };
      }
      return m;
    }));

    // Handle different action types
    switch (action.type) {
      case 'link_invoice':
        // Navigate to invoices or show relevant data
        toast.success('Factuuroverzicht geopend');
        break;
      case 'change_category':
        toast.success('Categorieën worden geladen...');
        break;
      case 'view_details':
        if (action.data?.categoryBreakdown) {
          const breakdown = Object.entries(action.data.categoryBreakdown)
            .map(([cat, amount]) => `${cat}: €${(amount as number).toFixed(2)}`)
            .join('\n');
          toast.success(`Kostenverdeling:\n${breakdown}`);
        }
        break;
    }
  };

  const suggestions = [
    { icon: TrendingUp, text: t('aiSuggestion1') },
    { icon: FileText, text: t('aiSuggestion2') },
    { icon: Tag, text: t('aiSuggestion3') },
    { icon: Lightbulb, text: t('aiSuggestion4') },
  ];

  const quickActions = [
    { label: 'Maandoverzicht', query: 'Geef een samenvatting van mijn financiën deze maand' },
    { label: 'BTW Berekening', query: 'Hoeveel BTW moet ik reserveren voor dit kwartaal?' },
    { label: 'Top Uitgaven', query: 'Wat zijn mijn 5 grootste uitgavenposten?' },
  ];

  return (
    <div className="h-full flex flex-col p-6 space-y-6">
      <AdminBreadcrumb currentPage="AI Boekhoudassistent" />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Brain className="h-8 w-8 text-primary" />
            {t('aiAssistant')}
          </h1>
          <p className="text-muted-foreground">{t('aiAssistantDescription')}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowHistory(!showHistory)}
          className="flex items-center gap-2"
        >
          <History className="h-4 w-4" />
          Geschiedenis
        </Button>
      </div>

      {/* Session Summary */}
      {sessionSummary && (
        <div className="bg-muted/50 rounded-lg p-3 flex items-center gap-2">
          <Badge variant="secondary">Sessie</Badge>
          <span className="text-sm text-muted-foreground">{sessionSummary}</span>
        </div>
      )}

      {/* Quick Actions */}
      {messages.length === 0 && (
        <div className="flex gap-2 flex-wrap">
          {quickActions.map((action, i) => (
            <Button
              key={i}
              variant="outline"
              size="sm"
              onClick={() => setInput(action.query)}
            >
              {action.label}
            </Button>
          ))}
        </div>
      )}

      <div className="flex gap-4 flex-1 min-h-0">
        {/* History Panel */}
        {showHistory && (
          <Card className="w-64 flex-shrink-0">
            <CardHeader className="py-3">
              <CardTitle className="text-sm">Recente Gesprekken</CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <ScrollArea className="h-[400px]">
                {conversationHistory.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-2">Geen geschiedenis</p>
                ) : (
                  <div className="space-y-2">
                    {conversationHistory.map(conv => (
                      <div
                        key={conv.id}
                        className="p-2 rounded-lg hover:bg-muted cursor-pointer"
                      >
                        <p className="text-xs text-muted-foreground">
                          {conv.date.toLocaleDateString()}
                        </p>
                        <p className="text-sm truncate">{conv.summary}</p>
                        <Badge variant="secondary" className="text-xs mt-1">
                          {conv.messageCount} berichten
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {/* Main Chat */}
        <Card className="flex-1 flex flex-col min-h-0">
          <CardHeader className="py-3 border-b">
            <CardTitle className="text-sm">{t('conversation')}</CardTitle>
            {messages.length > 0 && (
              <CardDescription>
                {messages.length} berichten in dit gesprek
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="flex-1 flex flex-col p-4 min-h-0">
            <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
              {messages.length === 0 ? (
                <div className="space-y-6">
                  <div className="text-center py-6">
                    <div className="p-4 bg-primary/10 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <Brain className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">Welkom bij je AI Boekhoudassistent</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      Ik help je met inzicht in je financiën. Stel een vraag over je facturen, uitgaven, BTW of maandoverzichten — ik analyseer je data en geef direct antwoord.
                    </p>
                  </div>
                  <div className="grid gap-2">
                    {suggestions.map((suggestion, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        className="justify-start text-left h-auto py-3 px-4"
                        onClick={() => setInput(suggestion.text)}
                      >
                        <suggestion.icon className="h-4 w-4 mr-2 flex-shrink-0 text-primary" />
                        <span className="text-sm">{suggestion.text}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message, index) => (
                    <div key={index}>
                      <div
                        className={`flex ${
                          message.role === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={
                            message.role === 'user'
                              ? 'max-w-[85%] rounded-2xl px-4 py-3 bg-primary text-primary-foreground shadow-subtle'
                              : 'ai-surface max-w-[85%] rounded-2xl px-4 py-3 pl-5 text-foreground'
                          }
                        >
                          {message.role === 'assistant' && (
                            <div className="flex items-center gap-1.5 mb-1.5 text-[11px] font-medium text-primary">
                              <Sparkles className="h-3 w-3" />
                              <span>Servio AI</span>
                            </div>
                          )}
                          <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
                          <span className="text-[11px] opacity-60 mt-2 block">
                            {message.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                      
                      
                      {/* AI Actions */}
                      {message.actions && message.actions.length > 0 && (
                        <div className="flex gap-2 mt-2 ml-2 flex-wrap">
                          {message.actions.map((action, actionIndex) => (
                            <Button
                              key={actionIndex}
                              variant={action.completed ? 'ghost' : 'secondary'}
                              size="sm"
                              onClick={() => executeAction(action, index)}
                              disabled={action.completed}
                              className="text-xs"
                            >
                              {action.completed ? (
                                <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                              ) : (
                                <Lightbulb className="h-3 w-3 mr-1" />
                              )}
                              {action.label}
                            </Button>
                          ))}
                        </div>
                      )}

                      {/* Show metadata summary if available */}
                      {message.metadata && message.role === 'assistant' && (
                        <div className="mt-2 ml-2 flex gap-2 flex-wrap">
                          {message.metadata.monthlyIncome > 0 && (
                            <Badge variant="outline" className="text-xs">
                              Omzet: €{message.metadata.monthlyIncome.toLocaleString()}
                            </Badge>
                          )}
                          {message.metadata.monthlyExpenses > 0 && (
                            <Badge variant="outline" className="text-xs">
                              Kosten: €{message.metadata.monthlyExpenses.toLocaleString()}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  {loading && (
                    <div className="flex justify-start">
                      <div className="bg-muted text-foreground rounded-lg p-4">
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm">{t('thinking')}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>

            <div className="flex gap-2 mt-4 pt-4 border-t">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder={t('askQuestion')}
                disabled={loading}
                className="flex-1"
              />
              <Button onClick={sendMessage} disabled={loading || !input.trim()}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
