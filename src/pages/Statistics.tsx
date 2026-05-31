import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Topbar } from '@/components/Topbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { 
  Mail, 
  Clock, 
  Zap, 
  TrendingUp, 
  BarChart3,
  PieChart as PieChartIcon,
  Users,
  Filter,
  Calendar,
  Loader2
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  Area,
  AreaChart
} from 'recharts';
import { SentimentTrendChart } from '@/components/statistics/SentimentTrendChart';

interface EmailStats {
  totalEmails: number;
  unreadEmails: number;
  readEmails: number;
  labelCounts: Record<string, number>;
  dailyVolume: { date: string; count: number; read: number }[];
}

const Statistics = () => {
  const { user } = useAuth();
  const [timePeriod, setTimePeriod] = useState('week');
  const [stats, setStats] = useState<EmailStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) loadStats();
  }, [user, timePeriod]);

  const getDateRange = () => {
    const now = new Date();
    switch (timePeriod) {
      case 'day': return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      case 'week': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      case 'month': return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      case 'quarter': {
        const q = Math.floor(now.getMonth() / 3);
        return new Date(now.getFullYear(), q * 3, 1).toISOString();
      }
      default: return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    }
  };

  const loadStats = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const startDate = getDateRange();

      const { data: emails, error } = await supabase
        .from('emails')
        .select('id, is_read, labels, received_at')
        .eq('user_id', user.id)
        .gte('received_at', startDate)
        .order('received_at', { ascending: true });

      if (error) throw error;

      const allEmails = emails || [];
      const totalEmails = allEmails.length;
      const unreadEmails = allEmails.filter(e => !e.is_read).length;
      const readEmails = totalEmails - unreadEmails;

      // Count labels
      const labelCounts: Record<string, number> = {};
      allEmails.forEach(e => {
        (e.labels || []).forEach((label: string) => {
          const cleanLabel = label.charAt(0).toUpperCase() + label.slice(1).toLowerCase();
          labelCounts[cleanLabel] = (labelCounts[cleanLabel] || 0) + 1;
        });
      });

      // Daily volume
      const dailyMap = new Map<string, { count: number; read: number }>();
      allEmails.forEach(e => {
        const day = new Date(e.received_at).toISOString().split('T')[0];
        const existing = dailyMap.get(day) || { count: 0, read: 0 };
        existing.count++;
        if (e.is_read) existing.read++;
        dailyMap.set(day, existing);
      });

      const dailyVolume = Array.from(dailyMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, data]) => ({
          date: new Date(date).toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric' }),
          count: data.count,
          read: data.read,
        }));

      setStats({ totalEmails, unreadEmails, readEmails, labelCounts, dailyVolume });
    } catch (error) {
      console.error('Error loading statistics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const labelColors: Record<string, string> = {
    'Inbox': 'hsl(217, 91%, 60%)',
    'Important': 'hsl(0, 72%, 51%)',
    'Sent': 'hsl(142, 76%, 36%)',
    'Starred': 'hsl(38, 92%, 50%)',
    'Unread': 'hsl(262, 83%, 58%)',
  };

  const getColor = (label: string, index: number) => {
    const fallback = [
      'hsl(217, 91%, 60%)', 'hsl(0, 72%, 51%)', 'hsl(142, 76%, 36%)',
      'hsl(262, 83%, 58%)', 'hsl(38, 92%, 50%)', 'hsl(215, 13%, 65%)',
      'hsl(190, 70%, 50%)', 'hsl(330, 60%, 55%)',
    ];
    return labelColors[label] || fallback[index % fallback.length];
  };

  const categoryData = stats ? Object.entries(stats.labelCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([name, value], index) => ({
      name,
      value,
      color: getColor(name, index),
    })) : [];

  const readUnreadData = stats ? [
    { name: 'Gelezen', value: stats.readEmails, color: 'hsl(142, 76%, 36%)' },
    { name: 'Ongelezen', value: stats.unreadEmails, color: 'hsl(38, 92%, 50%)' },
  ] : [];

  return (
    <div className="h-screen flex bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar />
        
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {/* Header with Filters */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <BarChart3 className="h-6 w-6 text-primary" />
                Statistieken
              </h1>
              <p className="text-muted-foreground">
                Overzicht van je email activiteit
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <Select value={timePeriod} onValueChange={setTimePeriod}>
                <SelectTrigger className="w-36">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Vandaag</SelectItem>
                  <SelectItem value="week">Deze week</SelectItem>
                  <SelectItem value="month">Deze maand</SelectItem>
                  <SelectItem value="quarter">Dit kwartaal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !stats || stats.totalEmails === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center max-w-md">
                <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-bold text-foreground mb-2">Geen data beschikbaar</h2>
                <p className="text-muted-foreground">
                  Er zijn geen emails gevonden voor deze periode. Koppel je mailbox en synchroniseer je emails om statistieken te zien.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="shadow-card">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Totaal Emails</CardTitle>
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Mail className="h-4 w-4 text-primary" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl md:text-3xl font-bold text-foreground">{stats.totalEmails}</div>
                    <p className="text-xs text-muted-foreground mt-1">in geselecteerde periode</p>
                  </CardContent>
                </Card>

                <Card className="shadow-card">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Ongelezen</CardTitle>
                    <div className="p-2 bg-warning/10 rounded-lg">
                      <Zap className="h-4 w-4 text-warning" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl md:text-3xl font-bold text-foreground">{stats.unreadEmails}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stats.totalEmails > 0 ? `${Math.round((stats.unreadEmails / stats.totalEmails) * 100)}% van totaal` : ''}
                    </p>
                  </CardContent>
                </Card>

                <Card className="shadow-card">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Gelezen</CardTitle>
                    <div className="p-2 bg-success/10 rounded-lg">
                      <TrendingUp className="h-4 w-4 text-success" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl md:text-3xl font-bold text-foreground">{stats.readEmails}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stats.totalEmails > 0 ? `${Math.round((stats.readEmails / stats.totalEmails) * 100)}% afgehandeld` : ''}
                    </p>
                  </CardContent>
                </Card>

                <Card className="shadow-card">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Labels</CardTitle>
                    <div className="p-2 bg-accent/10 rounded-lg">
                      <Filter className="h-4 w-4 text-accent" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl md:text-3xl font-bold text-foreground">{Object.keys(stats.labelCounts).length}</div>
                    <p className="text-xs text-muted-foreground mt-1">unieke labels</p>
                  </CardContent>
                </Card>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Mail volume over time */}
                <Card className="shadow-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center text-base">
                      <BarChart3 className="h-5 w-5 mr-2 text-primary" />
                      Email Volume Trend
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {stats.dailyVolume.length > 0 ? (
                      <ResponsiveContainer width="100%" height={280}>
                        <AreaChart data={stats.dailyVolume}>
                          <defs>
                            <linearGradient id="colorEmails" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                          <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))' }} className="text-xs" />
                          <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} className="text-xs" />
                          <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                          <Legend />
                          <Area type="monotone" dataKey="count" stroke="hsl(217, 91%, 60%)" fillOpacity={1} fill="url(#colorEmails)" strokeWidth={2} name="Totaal" />
                          <Area type="monotone" dataKey="read" stroke="hsl(142, 76%, 36%)" fill="transparent" strokeWidth={2} name="Gelezen" />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">Geen data voor deze periode</p>
                    )}
                  </CardContent>
                </Card>

                {/* Label distribution */}
                <Card className="shadow-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center text-base">
                      <BarChart3 className="h-5 w-5 mr-2 text-primary" />
                      Verdeling per Label
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {categoryData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={categoryData} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
                          <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                          <YAxis dataKey="name" type="category" width={100} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                          <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                            {categoryData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">Geen labels gevonden</p>
                    )}
                  </CardContent>
                </Card>

                {/* Read vs Unread */}
                <Card className="shadow-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center text-base">
                      <PieChartIcon className="h-5 w-5 mr-2 text-primary" />
                      Gelezen vs Ongelezen
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col md:flex-row items-center gap-6">
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie
                            data={readUnreadData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={80}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {readUnreadData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                        </PieChart>
                      </ResponsiveContainer>
                      
                      <div className="space-y-3 min-w-[160px]">
                        {readUnreadData.map((item, index) => {
                          const pct = stats.totalEmails > 0 ? Math.round((item.value / stats.totalEmails) * 100) : 0;
                          return (
                            <div key={index} className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                                <span className="text-sm text-foreground">{item.name}</span>
                              </div>
                              <div className="text-right">
                                <span className="text-sm font-semibold text-foreground">{pct}%</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Team Performance */}
                <Card className="shadow-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center text-base">
                      <Users className="h-5 w-5 mr-2 text-primary" />
                      Activiteit Overzicht
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                          <span className="text-sm font-semibold text-primary-foreground">
                            {user?.email?.charAt(0).toUpperCase() || 'U'}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{user?.email?.split('@')[0] || 'Gebruiker'}</p>
                          <Badge variant="secondary" className="bg-success/10 text-success text-xs">Actief</Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-foreground">{stats.totalEmails}</p>
                        <p className="text-xs text-muted-foreground">emails in periode</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-muted/30 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Gelezen ratio</p>
                        <p className="text-lg font-bold text-foreground">
                          {stats.totalEmails > 0 ? Math.round((stats.readEmails / stats.totalEmails) * 100) : 0}%
                        </p>
                        <div className="w-full h-1.5 bg-muted rounded-full mt-2 overflow-hidden">
                          <div 
                            className="h-full bg-success rounded-full transition-all"
                            style={{ width: `${stats.totalEmails > 0 ? (stats.readEmails / stats.totalEmails) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                      
                      <div className="p-3 bg-muted/30 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Ongelezen</p>
                        <p className="text-lg font-bold text-foreground">{stats.unreadEmails}</p>
                        <p className="text-xs text-muted-foreground mt-1">wachtend op actie</p>
                      </div>
                      
                      <div className="p-3 bg-muted/30 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Meeste label</p>
                        <p className="text-lg font-bold text-foreground">
                          {categoryData.length > 0 ? categoryData[0].name : '-'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {categoryData.length > 0 ? `${categoryData[0].value} emails` : ''}
                        </p>
                      </div>
                      
                      <div className="p-3 bg-muted/30 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Gem. per dag</p>
                        <p className="text-lg font-bold text-foreground">
                          {stats.dailyVolume.length > 0 ? Math.round(stats.totalEmails / stats.dailyVolume.length) : 0}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">emails/dag</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sentiment trend */}
              <SentimentTrendChart />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Statistics;
