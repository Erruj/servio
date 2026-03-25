import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Topbar } from '@/components/Topbar';
import { SubscriptionBanner } from '@/components/SubscriptionBanner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { 
  Mail, 
  Clock, 
  Zap, 
  AlertTriangle, 
  TrendingUp,
  TrendingDown,
  CheckCircle,
  MessageSquare,
  Timer,
  Calendar,
  ArrowRight,
  Inbox,
  FileText,
  BarChart3,
  Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';

interface DashboardStats {
  totalEmails: number;
  unreadEmails: number;
  todayEmails: number;
  weekEmails: number;
  monthEmails: number;
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
  const [timeFilter, setTimeFilter] = useState('today');
  const [stats, setStats] = useState<DashboardStats>({ totalEmails: 0, unreadEmails: 0, todayEmails: 0, weekEmails: 0, monthEmails: 0 });
  const [recentEmails, setRecentEmails] = useState<RecentEmail[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      // Fetch all email counts in parallel
      const [totalRes, unreadRes, todayRes, weekRes, monthRes, recentRes] = await Promise.all([
        supabase.from('emails').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('emails').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_read', false),
        supabase.from('emails').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('received_at', todayStart),
        supabase.from('emails').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('received_at', weekStart),
        supabase.from('emails').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('received_at', monthStart),
        supabase.from('emails').select('id, subject, from_name, from_email, received_at, is_read').eq('user_id', user.id).order('received_at', { ascending: false }).limit(5),
      ]);

      setStats({
        totalEmails: totalRes.count || 0,
        unreadEmails: unreadRes.count || 0,
        todayEmails: todayRes.count || 0,
        weekEmails: weekRes.count || 0,
        monthEmails: monthRes.count || 0,
      });

      setRecentEmails((recentRes.data as RecentEmail[]) || []);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
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
            
            {/* Header with Time Filter */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
                  <BarChart3 className="h-7 w-7 text-primary" />
                  Dashboard
                </h1>
                <p className="text-muted-foreground">
                  Overzicht van je support activiteiten
                </p>
              </div>
              
              <Select value={timeFilter} onValueChange={setTimeFilter}>
                <SelectTrigger className="w-40">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Vandaag</SelectItem>
                  <SelectItem value="week">Deze week</SelectItem>
                  <SelectItem value="month">Deze maand</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {/* Key Metrics Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="shadow-card hover:shadow-elevated transition-all duration-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
                        Mails {timeFilter === 'today' ? 'Vandaag' : timeFilter === 'week' ? 'Deze Week' : 'Deze Maand'}
                      </CardTitle>
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Mail className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl md:text-3xl font-bold text-foreground">
                        {getMailCount()}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{stats.totalEmails} totaal</p>
                    </CardContent>
                  </Card>

                  <Card className="shadow-card hover:shadow-elevated transition-all duration-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
                        Ongelezen
                      </CardTitle>
                      <div className="p-2 bg-warning/10 rounded-lg">
                        <Zap className="h-4 w-4 md:h-5 md:w-5 text-warning" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl md:text-3xl font-bold text-foreground">
                        {stats.unreadEmails}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">wachtend op actie</p>
                    </CardContent>
                  </Card>

                  <Card className="shadow-card hover:shadow-elevated transition-all duration-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
                        Totaal Emails
                      </CardTitle>
                      <div className="p-2 bg-accent/10 rounded-lg">
                        <Clock className="h-4 w-4 md:h-5 md:w-5 text-accent" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl md:text-3xl font-bold text-foreground">
                        {stats.totalEmails}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">gesynchroniseerd</p>
                    </CardContent>
                  </Card>

                  <Card className="shadow-card hover:shadow-elevated transition-all duration-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
                        Gelezen
                      </CardTitle>
                      <div className="p-2 bg-success/10 rounded-lg">
                        <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-success" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl md:text-3xl font-bold text-foreground">
                        {stats.totalEmails - stats.unreadEmails}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">afgehandeld</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Quick Actions */}
                <Card className="shadow-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-primary" />
                      Snelle Acties
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Button
                        variant="outline"
                        className="h-auto p-4 flex items-center justify-start gap-3 bg-destructive/5 border-destructive/20 hover:bg-destructive/10 hover:border-destructive/30 transition-all"
                        onClick={() => navigate('/app')}
                      >
                        <div className="p-2 bg-destructive rounded-lg flex-shrink-0">
                          <AlertTriangle className="h-5 w-5 text-destructive-foreground" />
                        </div>
                        <div className="text-left flex-1">
                          <h3 className="font-semibold text-foreground">Inbox</h3>
                          <p className="text-sm text-muted-foreground">{stats.unreadEmails} ongelezen</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </Button>

                      <Button
                        variant="outline"
                        className="h-auto p-4 flex items-center justify-start gap-3 bg-success/5 border-success/20 hover:bg-success/10 hover:border-success/30 transition-all"
                        onClick={() => navigate('/templates')}
                      >
                        <div className="p-2 bg-success rounded-lg flex-shrink-0">
                          <FileText className="h-5 w-5 text-success-foreground" />
                        </div>
                        <div className="text-left flex-1">
                          <h3 className="font-semibold text-foreground">Templates</h3>
                          <p className="text-sm text-muted-foreground">Beheer antwoorden</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </Button>

                      <Button
                        variant="outline"
                        className="h-auto p-4 flex items-center justify-start gap-3 bg-primary/5 border-primary/20 hover:bg-primary/10 hover:border-primary/30 transition-all"
                        onClick={() => navigate('/stats')}
                      >
                        <div className="p-2 bg-primary rounded-lg flex-shrink-0">
                          <BarChart3 className="h-5 w-5 text-primary-foreground" />
                        </div>
                        <div className="text-left flex-1">
                          <h3 className="font-semibold text-foreground">Statistieken</h3>
                          <p className="text-sm text-muted-foreground">Bekijk details</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Emails - Real Data */}
                <Card className="shadow-card">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <Clock className="h-5 w-5 text-primary" />
                        Recente Emails
                      </CardTitle>
                      <Button variant="ghost" size="sm" onClick={() => navigate('/app')}>
                        Bekijk alles
                        <ArrowRight className="h-4 w-4 ml-1" />
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
                          <div 
                            key={email.id} 
                            className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                            onClick={() => navigate('/app')}
                          >
                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                              !email.is_read ? 'bg-primary' : 'bg-muted-foreground/30'
                            }`} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-medium text-foreground text-sm truncate">
                                  {email.from_name || email.from_email}
                                </span>
                                <span className="text-xs text-muted-foreground flex-shrink-0">
                                  {formatDistanceToNow(new Date(email.received_at), { addSuffix: true, locale: nl })}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground truncate">
                                {email.subject || '(Geen onderwerp)'}
                              </p>
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
