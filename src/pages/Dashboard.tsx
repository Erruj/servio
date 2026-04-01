import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Topbar } from '@/components/Topbar';
import { SubscriptionBanner } from '@/components/SubscriptionBanner';
import { OnboardingDialog } from '@/components/OnboardingDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useUsageTracking } from '@/hooks/useUsageTracking';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { 
  Mail, Clock, Zap, CheckCircle, BarChart3, Calendar, ArrowRight,
  FileText, Loader2, TrendingUp, Receipt, FileBox, Sparkles, Users
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';

interface DashboardStats {
  totalEmails: number;
  unreadEmails: number;
  todayEmails: number;
  weekEmails: number;
  monthEmails: number;
  totalInvoices: number;
  totalReceipts: number;
  totalDocuments: number;
  connectionsCount: number;
}

interface RecentEmail {
  id: string;
  subject: string | null;
  from_name: string | null;
  from_email: string;
  received_at: string;
  is_read: boolean;
}

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { usage, isLoading: usageLoading } = useUsageTracking();
  const { tier, tierLabel } = useFeatureAccess();
  const [timeFilter, setTimeFilter] = useState('today');
  const [stats, setStats] = useState<DashboardStats>({
    totalEmails: 0, unreadEmails: 0, todayEmails: 0, weekEmails: 0, monthEmails: 0,
    totalInvoices: 0, totalReceipts: 0, totalDocuments: 0, connectionsCount: 0,
  });
  const [recentEmails, setRecentEmails] = useState<RecentEmail[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { if (user) loadDashboardData(); }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const [totalRes, unreadRes, todayRes, weekRes, monthRes, recentRes, invoiceRes, receiptRes, docRes, connRes] = await Promise.all([
        supabase.from('emails').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('emails').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_read', false),
        supabase.from('emails').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('received_at', todayStart),
        supabase.from('emails').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('received_at', weekStart),
        supabase.from('emails').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('received_at', monthStart),
        supabase.from('emails').select('id, subject, from_name, from_email, received_at, is_read').eq('user_id', user.id).order('received_at', { ascending: false }).limit(5),
        supabase.from('invoices').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('receipts').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('documents').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('email_connections').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      ]);

      setStats({
        totalEmails: totalRes.count || 0, unreadEmails: unreadRes.count || 0,
        todayEmails: todayRes.count || 0, weekEmails: weekRes.count || 0, monthEmails: monthRes.count || 0,
        totalInvoices: invoiceRes.count || 0, totalReceipts: receiptRes.count || 0,
        totalDocuments: docRes.count || 0, connectionsCount: connRes.count || 0,
      });
      setRecentEmails((recentRes.data as RecentEmail[]) || []);
    } catch (error) { console.error('Error loading dashboard data:', error); }
    finally { setIsLoading(false); }
  };

  const getMailCount = () => {
    switch (timeFilter) {
      case 'today': return stats.todayEmails;
      case 'week': return stats.weekEmails;
      case 'month': return stats.monthEmails;
      default: return stats.todayEmails;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header user={user} onLogout={signOut} />
      <div className="flex-1 flex">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Topbar />
          <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 space-y-6">
            <SubscriptionBanner />
            <OnboardingDialog />
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
                  <BarChart3 className="h-7 w-7 text-primary" /> Dashboard
                </h1>
                <p className="text-muted-foreground">{t('welcome').split('—')[0]}</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="text-sm">{tierLabel}</Badge>
                <Select value={timeFilter} onValueChange={setTimeFilter}>
                  <SelectTrigger className="w-40"><Calendar className="h-4 w-4 mr-2" /><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Vandaag</SelectItem>
                    <SelectItem value="week">Deze week</SelectItem>
                    <SelectItem value="month">Deze maand</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : (
              <>
                {/* Key Metrics */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: timeFilter === 'today' ? 'Vandaag' : timeFilter === 'week' ? 'Deze Week' : 'Deze Maand', value: getMailCount(), sub: `${stats.totalEmails} totaal`, icon: Mail, color: 'primary' },
                    { label: 'Ongelezen', value: stats.unreadEmails, sub: 'wachtend op actie', icon: Zap, color: 'warning' },
                    { label: 'Mailboxen', value: stats.connectionsCount, sub: 'gekoppeld', icon: Users, color: 'accent' },
                    { label: 'Gelezen', value: stats.totalEmails - stats.unreadEmails, sub: 'afgehandeld', icon: CheckCircle, color: 'success' },
                  ].map((m, i) => (
                    <Card key={i} className="shadow-card hover:shadow-elevated transition-all duration-200">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">{m.label}</CardTitle>
                        <div className={`p-2 bg-${m.color}/10 rounded-lg`}><m.icon className={`h-4 w-4 md:h-5 md:w-5 text-${m.color}`} /></div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl md:text-3xl font-bold text-foreground">{m.value}</div>
                        <p className="text-xs text-muted-foreground mt-1">{m.sub}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Administration widgets */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="shadow-card hover:shadow-elevated transition-all cursor-pointer" onClick={() => navigate('/administration/invoices')}>
                    <CardContent className="p-6 flex items-center gap-4">
                      <div className="p-3 bg-primary/10 rounded-xl"><Receipt className="h-6 w-6 text-primary" /></div>
                      <div className="flex-1">
                        <p className="text-2xl font-bold text-foreground">{stats.totalInvoices}</p>
                        <p className="text-sm text-muted-foreground">Facturen</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </CardContent>
                  </Card>
                  <Card className="shadow-card hover:shadow-elevated transition-all cursor-pointer" onClick={() => navigate('/administration/receipts')}>
                    <CardContent className="p-6 flex items-center gap-4">
                      <div className="p-3 bg-success/10 rounded-xl"><TrendingUp className="h-6 w-6 text-success" /></div>
                      <div className="flex-1">
                        <p className="text-2xl font-bold text-foreground">{stats.totalReceipts}</p>
                        <p className="text-sm text-muted-foreground">Bonnetjes</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </CardContent>
                  </Card>
                  <Card className="shadow-card hover:shadow-elevated transition-all cursor-pointer" onClick={() => navigate('/administration/documents')}>
                    <CardContent className="p-6 flex items-center gap-4">
                      <div className="p-3 bg-accent/10 rounded-xl"><FileBox className="h-6 w-6 text-accent" /></div>
                      <div className="flex-1">
                        <p className="text-2xl font-bold text-foreground">{stats.totalDocuments}</p>
                        <p className="text-sm text-muted-foreground">Documenten</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </CardContent>
                  </Card>
                </div>

                {/* Usage & Quick Actions row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Usage widget */}
                  {!usageLoading && usage.emailLimit && (
                    <Card className="shadow-card">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                          <Sparkles className="h-5 w-5 text-primary" /> Gebruik deze maand
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">E-mails</span>
                            <span className="font-medium">{usage.emailCount}/{usage.emailLimit}</span>
                          </div>
                          <Progress value={usage.emailLimit ? (usage.emailCount / usage.emailLimit) * 100 : 0} className="h-2" />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">AI-calls</span>
                            <span className="font-medium">{usage.aiCallCount}/{usage.aiCallLimit}</span>
                          </div>
                          <Progress value={usage.aiCallLimit ? (usage.aiCallCount / usage.aiCallLimit) * 100 : 0} className="h-2" />
                        </div>
                        {(usage.isEmailLimitReached || usage.isAiLimitReached) && (
                          <Button size="sm" onClick={() => navigate('/pricing')} className="w-full">Upgrade naar Pro</Button>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Quick Actions */}
                  <Card className="shadow-card">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-primary" /> Snelle Acties
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 gap-3">
                        {[
                          { label: 'Inbox', desc: `${stats.unreadEmails} ongelezen`, href: '/app', icon: Mail, color: 'destructive' },
                          { label: 'Templates', desc: 'Beheer antwoorden', href: '/templates', icon: FileText, color: 'success' },
                          { label: 'Statistieken', desc: 'Bekijk details', href: '/stats', icon: BarChart3, color: 'primary' },
                        ].map((a, i) => (
                          <Button key={i} variant="outline" className="h-auto p-3 flex items-center justify-start gap-3" onClick={() => navigate(a.href)}>
                            <div className={`p-2 bg-${a.color} rounded-lg flex-shrink-0`}><a.icon className={`h-4 w-4 text-${a.color}-foreground`} /></div>
                            <div className="text-left flex-1">
                              <h3 className="font-semibold text-foreground text-sm">{a.label}</h3>
                              <p className="text-xs text-muted-foreground">{a.desc}</p>
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Emails */}
                <Card className="shadow-card">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <Clock className="h-5 w-5 text-primary" /> Recente Emails
                      </CardTitle>
                      <Button variant="ghost" size="sm" onClick={() => navigate('/app')}>
                        Bekijk alles <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {recentEmails.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Nog geen emails gesynchroniseerd. Ga naar de inbox om je mailbox te koppelen.
                      </p>
                    ) : (
                      <div className="space-y-1">
                        {recentEmails.map((email) => (
                          <div key={email.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => navigate('/app')}>
                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${!email.is_read ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-medium text-foreground text-sm truncate">{email.from_name || email.from_email}</span>
                                <span className="text-xs text-muted-foreground flex-shrink-0">
                                  {formatDistanceToNow(new Date(email.received_at), { addSuffix: true, locale: nl })}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground truncate">{email.subject || '(Geen onderwerp)'}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Dashboard;
