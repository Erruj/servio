import { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Topbar } from '@/components/Topbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { dummyStats } from '@/lib/dummy';
import { 
  Mail, 
  Clock, 
  Zap, 
  TrendingUp, 
  BarChart3,
  PieChart as PieChartIcon,
  Users,
  Filter,
  ThumbsUp,
  ThumbsDown,
  Minus,
  Calendar
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
  LineChart,
  Line,
  Legend,
  Area,
  AreaChart
} from 'recharts';

const Statistics = () => {
  const [timePeriod, setTimePeriod] = useState('week');
  const [categoryFilter, setCategoryFilter] = useState('all');
  
  const latestStats = dummyStats[0];
  
  // Transform data for charts
  const categoryData = Object.entries(latestStats.byCategory).map(([name, value]) => ({
    name,
    value,
    color: getCategoryColor(name)
  }));

  const sentimentData = Object.entries(latestStats.sentimentShare).map(([name, value]) => ({
    name: name === 'Negatief' ? 'Negatief' : name === 'Positief' ? 'Positief' : 'Neutraal',
    value,
    color: getSentimentColor(name),
    icon: name === 'Negatief' ? ThumbsDown : name === 'Positief' ? ThumbsUp : Minus
  }));

  // Extended time series data with more detail
  const timeSeriesData = dummyStats.map((stat, index) => ({
    date: new Date(stat.date).toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric' }),
    mails: stat.totalMails,
    responseTime: stat.avgResponseMins,
    autoReply: stat.autoReplyPct,
    resolved: Math.round(stat.totalMails * 0.85),
    pending: Math.round(stat.totalMails * 0.15),
  })).reverse();

  function getCategoryColor(category: string) {
    const colors: Record<string, string> = {
      'Retour': 'hsl(217, 91%, 60%)',
      'Klacht': 'hsl(0, 72%, 51%)',
      'Factuur': 'hsl(142, 76%, 36%)',
      'Vraag': 'hsl(262, 83%, 58%)',
      'Technisch': 'hsl(38, 92%, 50%)',
      'Overig': 'hsl(215, 13%, 65%)'
    };
    return colors[category] || 'hsl(215, 13%, 65%)';
  }

  function getSentimentColor(sentiment: string) {
    const colors: Record<string, string> = {
      'Negatief': 'hsl(0, 72%, 51%)',
      'Neutraal': 'hsl(215, 13%, 65%)',
      'Positief': 'hsl(142, 76%, 36%)'
    };
    return colors[sentiment] || 'hsl(215, 13%, 65%)';
  }

  // Calculate totals for sentiment
  const totalSentiment = sentimentData.reduce((acc, item) => acc + item.value, 0);

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
                Overzicht van je support prestaties
              </p>
            </div>
            
            {/* Filters */}
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
              
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Alle categorieën" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle categorieën</SelectItem>
                  <SelectItem value="retour">Retour</SelectItem>
                  <SelectItem value="klacht">Klacht</SelectItem>
                  <SelectItem value="vraag">Vraag</SelectItem>
                  <SelectItem value="factuur">Factuur</SelectItem>
                  <SelectItem value="technisch">Technisch</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="shadow-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Mails Totaal
                </CardTitle>
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Mail className="h-4 w-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl md:text-3xl font-bold text-foreground">
                  {latestStats.totalMails}
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3 text-success" />
                  <span className="text-xs text-success font-medium">+12%</span>
                  <span className="text-xs text-muted-foreground">vs vorige periode</span>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Gem. Reactietijd
                </CardTitle>
                <div className="p-2 bg-accent/10 rounded-lg">
                  <Clock className="h-4 w-4 text-accent" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl md:text-3xl font-bold text-foreground">
                  {Math.floor(latestStats.avgResponseMins / 60)}u {latestStats.avgResponseMins % 60}m
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3 text-success" />
                  <span className="text-xs text-success font-medium">-8%</span>
                  <span className="text-xs text-muted-foreground">verbetering</span>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Auto-Reply %
                </CardTitle>
                <div className="p-2 bg-warning/10 rounded-lg">
                  <Zap className="h-4 w-4 text-warning" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl md:text-3xl font-bold text-foreground">
                  {latestStats.autoReplyPct}%
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs text-muted-foreground">
                    {Math.round(latestStats.totalMails * latestStats.autoReplyPct / 100)} van {latestStats.totalMails} mails
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Top Categorie
                </CardTitle>
                <div className="p-2 bg-success/10 rounded-lg">
                  <TrendingUp className="h-4 w-4 text-success" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl md:text-3xl font-bold text-foreground">
                  Vraag
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs text-muted-foreground">
                    {latestStats.byCategory.Vraag} mails ({Math.round(latestStats.byCategory.Vraag / latestStats.totalMails * 100)}%)
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Mail volume over time - Enhanced */}
            <Card className="shadow-card">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-base">
                  <BarChart3 className="h-5 w-5 mr-2 text-primary" />
                  Mail Volume Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={timeSeriesData}>
                    <defs>
                      <linearGradient id="colorMails" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="date" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="mails" 
                      stroke="hsl(217, 91%, 60%)" 
                      fillOpacity={1}
                      fill="url(#colorMails)"
                      strokeWidth={2}
                      name="Totaal mails"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="resolved" 
                      stroke="hsl(142, 76%, 36%)" 
                      strokeWidth={2}
                      dot={false}
                      name="Afgehandeld"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Category distribution - Enhanced */}
            <Card className="shadow-card">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-base">
                  <BarChart3 className="h-5 w-5 mr-2 text-primary" />
                  Verdeling per Categorie
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={categoryData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
                    <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis dataKey="name" type="category" width={80} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Sentiment distribution - Enhanced with labels */}
            <Card className="shadow-card">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-base">
                  <PieChartIcon className="h-5 w-5 mr-2 text-primary" />
                  Sentiment Analyse
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={sentimentData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {sentimentData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  {/* Sentiment Legend with icons and percentages */}
                  <div className="space-y-3 min-w-[160px]">
                    {sentimentData.map((item, index) => {
                      const Icon = item.icon;
                      const percentage = Math.round((item.value / totalSentiment) * 100);
                      return (
                        <div key={index} className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: item.color }}
                            />
                            <Icon className="h-4 w-4" style={{ color: item.color }} />
                            <span className="text-sm text-foreground">{item.name}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-semibold text-foreground">{percentage}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Team Performance - Enhanced */}
            <Card className="shadow-card">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-base">
                  <Users className="h-5 w-5 mr-2 text-primary" />
                  Team Prestaties
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-primary-foreground">ST</span>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Support Team</p>
                      <Badge variant="secondary" className="bg-success/10 text-success text-xs">Actief</Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-foreground">{latestStats.totalMails}</p>
                    <p className="text-xs text-muted-foreground">mails afgehandeld</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Reactietijd</p>
                    <p className="text-lg font-bold text-foreground">
                      {Math.floor(latestStats.avgResponseMins / 60)}u {latestStats.avgResponseMins % 60}m
                    </p>
                    <Badge variant="secondary" className="bg-success/10 text-success text-xs mt-1">
                      -8% vs vorige week
                    </Badge>
                  </div>
                  
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Klanttevredenheid</p>
                    <p className="text-lg font-bold text-success">4.8/5</p>
                    <div className="flex items-center gap-0.5 mt-1">
                      {[1,2,3,4,5].map((star) => (
                        <span key={star} className={`text-xs ${star <= 4 ? 'text-warning' : 'text-muted'}`}>★</span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Auto-reply ratio</p>
                    <p className="text-lg font-bold text-foreground">{latestStats.autoReplyPct}%</p>
                    <div className="w-full h-1.5 bg-muted rounded-full mt-2 overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${latestStats.autoReplyPct}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">First Response</p>
                    <p className="text-lg font-bold text-foreground">95%</p>
                    <p className="text-xs text-muted-foreground mt-1">binnen 2 uur</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Statistics;