import { useEffect, useMemo, useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import {
  BarChart3,
  TrendingUp,
  Users,
  Clock,
  Mail,
  Zap,
  CheckCircle,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EmailRow {
  is_read: boolean;
  labels: string[] | null;
  received_at: string;
  ai_reply_generated: boolean | null;
  customer_sentiment: string | null;
}

const DAYS_NL = ['Zo', 'Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za'];
const CATEGORY_COLORS = ['bg-primary', 'bg-destructive', 'bg-warning', 'bg-success', 'bg-accent', 'bg-muted-foreground'];

const Analytics = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<EmailRow[]>([]);
  const [prevTotal, setPrevTotal] = useState(0);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      try {
        const now = Date.now();
        const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
        const fourteenDaysAgo = new Date(now - 14 * 24 * 60 * 60 * 1000).toISOString();

        const [curr, prev] = await Promise.all([
          supabase
            .from('emails')
            .select('is_read, labels, received_at, ai_reply_generated, customer_sentiment')
            .eq('user_id', user.id)
            .gte('received_at', sevenDaysAgo),
          supabase
            .from('emails')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .gte('received_at', fourteenDaysAgo)
            .lt('received_at', sevenDaysAgo),
        ]);
        if (curr.error) throw curr.error;
        setRows((curr.data as EmailRow[]) || []);
        setPrevTotal(prev.count || 0);
      } catch (error: any) {
        toast({
          title: 'Analytics laden mislukt',
          description: error.message || 'Probeer het opnieuw of ververs de pagina.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user, toast]);

  const derived = useMemo(() => {
    const total = rows.length;
    const resolved = rows.filter(r => r.is_read).length;
    const aiHandled = rows.filter(r => r.ai_reply_generated).length;
    const aiRate = total ? Math.round((aiHandled / total) * 100) : 0;
    const positive = rows.filter(r => (r.customer_sentiment || '').toLowerCase() === 'positive').length;
    const negative = rows.filter(r => (r.customer_sentiment || '').toLowerCase() === 'negative').length;
    const sentimentTotal = positive + negative + rows.filter(r => (r.customer_sentiment || '').toLowerCase() === 'neutral').length;
    const satisfactionScore = sentimentTotal ? ((positive - negative) / sentimentTotal) * 100 : null;

    const trendPct = prevTotal > 0 ? Math.round(((total - prevTotal) / prevTotal) * 100) : null;

    // Weekly buckets (per weekday, last 7 days)
    const byDay = new Map<number, { mails: number; resolved: number }>();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      byDay.set(d.getDay(), { mails: 0, resolved: 0 });
    }
    rows.forEach(r => {
      const d = new Date(r.received_at).getDay();
      const cur = byDay.get(d) || { mails: 0, resolved: 0 };
      cur.mails += 1;
      if (r.is_read) cur.resolved += 1;
      byDay.set(d, cur);
    });
    const weekly = Array.from(byDay.entries()).map(([day, v]) => ({
      day: DAYS_NL[day],
      mails: v.mails,
      resolved: v.resolved,
    }));
    const maxMails = Math.max(1, ...weekly.map(w => w.mails));

    // Categories from labels
    const catMap = new Map<string, number>();
    rows.forEach(r => (r.labels || []).forEach(l => {
      const key = l.charAt(0).toUpperCase() + l.slice(1).toLowerCase();
      catMap.set(key, (catMap.get(key) || 0) + 1);
    }));
    const categories = Array.from(catMap.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6)
      .map(([category, count], i) => ({
        category,
        count,
        percentage: total ? Math.round((count / total) * 100) : 0,
        color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
      }));

    return { total, resolved, aiRate, satisfactionScore, trendPct, weekly, maxMails, categories };
  }, [rows, prevTotal]);

  const hasData = rows.length > 0;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header user={user} onLogout={signOut} />
      <div className="flex-1 flex">
        <Sidebar />
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 md:p-8">
            <PageHeader
              title="Analytics"
              description="Inzicht in je e-mailactiviteit van de afgelopen 7 dagen."
            />

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : !hasData ? (
              <Card className="shadow-card">
                <CardContent className="p-0">
                  <EmptyState
                    icon={BarChart3}
                    title="Nog geen data"
                    description="Zodra er e-mails binnenkomen zie je hier trends, categorieën en AI-prestaties."
                  />
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* KPI's */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="shadow-card">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Totaal mails (7 dagen)</CardTitle>
                      <Mail className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{derived.total}</div>
                      {derived.trendPct !== null && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <TrendingUp className={`h-3 w-3 ${derived.trendPct >= 0 ? 'text-success' : 'text-destructive'}`} />
                          <span className={derived.trendPct >= 0 ? 'text-success' : 'text-destructive'}>
                            {derived.trendPct >= 0 ? '+' : ''}{derived.trendPct}%
                          </span>
                          <span>t.o.v. vorige week</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="shadow-card">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">AI antwoorden</CardTitle>
                      <Zap className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{derived.aiRate}%</div>
                      <p className="text-xs text-muted-foreground mt-1">van e-mails met AI-reply</p>
                    </CardContent>
                  </Card>

                  <Card className="shadow-card">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Afgehandeld</CardTitle>
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{derived.resolved}</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {derived.total ? `${Math.round((derived.resolved / derived.total) * 100)}% van totaal` : '—'}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="shadow-card">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Klanttevredenheid</CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {derived.satisfactionScore === null ? '—' : `${derived.satisfactionScore > 0 ? '+' : ''}${Math.round(derived.satisfactionScore)}`}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">sentimentscore</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Weekly */}
                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-primary" /> Weekoverzicht
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-7 gap-3">
                      {derived.weekly.map((stat, index) => (
                        <div key={index} className="text-center space-y-2">
                          <div className="text-xs font-medium text-muted-foreground">{stat.day}</div>
                          <div className="h-20 bg-primary/10 rounded flex items-end justify-center">
                            <div
                              className="w-8 bg-primary rounded-t transition-all"
                              style={{ height: `${(stat.mails / derived.maxMails) * 100}%` }}
                            />
                          </div>
                          <div className="text-xs">
                            <div className="font-medium">{stat.mails}</div>
                            <div className="text-muted-foreground">mails</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-center mt-4">
                      <Badge variant="secondary" className="bg-primary/10 text-primary">
                        Gemiddeld {Math.round(derived.total / 7)} mails per dag
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Categories */}
                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle className="text-lg">Categorie analyse</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {derived.categories.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-6">Nog geen labels toegekend.</p>
                    ) : (
                      <div className="space-y-4">
                        {derived.categories.map((stat, index) => (
                          <div key={index} className="flex items-center space-x-4">
                            <div className={`w-3 h-3 rounded ${stat.color}`} />
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-sm">{stat.category}</span>
                                <Badge variant="secondary">{stat.count} mails</Badge>
                              </div>
                              <div className="w-full bg-secondary rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full ${stat.color}`}
                                  style={{ width: `${stat.percentage}%` }}
                                />
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {stat.percentage}% van alle mails
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Insights */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="shadow-card">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Zap className="h-5 w-5 text-primary" /> AI performance
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">AI-antwoorden gegenereerd</span>
                        <Badge className="bg-success/10 text-success">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          {rows.filter(r => r.ai_reply_generated).length}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Handmatige afhandeling</span>
                        <Badge variant="secondary">
                          <Users className="h-3 w-3 mr-1" />
                          {rows.filter(r => !r.ai_reply_generated).length}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">AI-dekkingsgraad</span>
                        <Badge className="bg-primary/10 text-primary">{derived.aiRate}%</Badge>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="shadow-card">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-warning" /> Aandachtspunten
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {(() => {
                        const busiest = [...derived.weekly].sort((a, b) => b.mails - a.mails)[0];
                        const unread = rows.filter(r => !r.is_read).length;
                        return (
                          <>
                            {busiest && busiest.mails > 0 && (
                              <div className="flex items-center gap-3">
                                <AlertTriangle className="h-4 w-4 text-warning" />
                                <div>
                                  <div className="text-sm font-medium">Drukste dag: {busiest.day}</div>
                                  <div className="text-xs text-muted-foreground">{busiest.mails} e-mails ontvangen</div>
                                </div>
                              </div>
                            )}
                            <div className="flex items-center gap-3">
                              <Clock className="h-4 w-4 text-primary" />
                              <div>
                                <div className="text-sm font-medium">Nog {unread} openstaand</div>
                                <div className="text-xs text-muted-foreground">
                                  {derived.total ? `${Math.round((unread / derived.total) * 100)}% wacht op reactie` : ''}
                                </div>
                              </div>
                            </div>
                            {derived.satisfactionScore !== null && (
                              <div className="flex items-center gap-3">
                                <TrendingUp className={`h-4 w-4 ${derived.satisfactionScore >= 0 ? 'text-success' : 'text-destructive'}`} />
                                <div>
                                  <div className="text-sm font-medium">Sentimentscore</div>
                                  <div className="text-xs text-muted-foreground">
                                    {derived.satisfactionScore > 0 ? '+' : ''}{Math.round(derived.satisfactionScore)} van klanten
                                  </div>
                                </div>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Analytics;
