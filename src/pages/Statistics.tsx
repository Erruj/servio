import { Sidebar } from '@/components/Sidebar';
import { Topbar } from '@/components/Topbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { dummyStats } from '@/lib/dummy';
import { 
  Mail, 
  Clock, 
  Zap, 
  TrendingUp, 
  BarChart3,
  PieChart,
  Users
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Cell,
  LineChart,
  Line
} from 'recharts';

const Statistics = () => {
  const latestStats = dummyStats[0];
  
  // Transform data for charts
  const categoryData = Object.entries(latestStats.byCategory).map(([name, value]) => ({
    name,
    value,
    color: getCategoryColor(name)
  }));

  const sentimentData = Object.entries(latestStats.sentimentShare).map(([name, value]) => ({
    name,
    value,
    color: getSentimentColor(name)
  }));

  const timeSeriesData = dummyStats.reverse().map((stat, index) => ({
    date: new Date(stat.date).toLocaleDateString('nl-NL', { month: 'short', day: 'numeric' }),
    mails: stat.totalMails,
    responseTime: stat.avgResponseMins,
    autoReply: stat.autoReplyPct
  }));

  function getCategoryColor(category: string) {
    const colors: Record<string, string> = {
      'Retour': '#3b82f6',
      'Klacht': '#ef4444',
      'Factuur': '#10b981',
      'Vraag': '#8b5cf6',
      'Technisch': '#f59e0b',
      'Overig': '#6b7280'
    };
    return colors[category] || '#6b7280';
  }

  function getSentimentColor(sentiment: string) {
    const colors: Record<string, string> = {
      'Negatief': '#ef4444',
      'Neutraal': '#6b7280',
      'Positief': '#10b981'
    };
    return colors[sentiment] || '#6b7280';
  }

  return (
    <div className="h-screen flex bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col">
        <Topbar />
        
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Statistieken</h1>
              <p className="text-muted-foreground">
                Overzicht van je support prestaties
              </p>
            </div>
            <Badge variant="outline">Vandaag</Badge>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Mails Vandaag
                </CardTitle>
                <Mail className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {latestStats.totalMails}
                </div>
                <p className="text-xs text-muted-foreground">
                  +12% van gisteren
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Gem. Reactietijd
                </CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {Math.floor(latestStats.avgResponseMins / 60)}u {latestStats.avgResponseMins % 60}m
                </div>
                <p className="text-xs text-success">
                  -8% verbetering
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Auto-Reply %
                </CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {latestStats.autoReplyPct}%
                </div>
                <p className="text-xs text-muted-foreground">
                  van alle mails
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Top Categorie
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  Vraag
                </div>
                <p className="text-xs text-muted-foreground">
                  {latestStats.byCategory.Vraag} mails
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Mail volume over time */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Mails per Dag
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="mails" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Category distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Verdeling per Categorie
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={categoryData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Sentiment distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PieChart className="h-5 w-5 mr-2" />
                  Sentiment Verdeling
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      dataKey="value"
                      data={sentimentData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, value }) => `${name}: ${value}%`}
                    >
                      {sentimentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Performance metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Team Prestaties
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-primary-foreground">ST</span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Support Team</p>
                      <p className="text-sm text-muted-foreground">Actief</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-foreground">{latestStats.totalMails}</p>
                    <p className="text-sm text-muted-foreground">mails afgehandeld</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Reactietijd</span>
                    <span className="font-medium text-foreground">
                      {Math.floor(latestStats.avgResponseMins / 60)}u {latestStats.avgResponseMins % 60}m
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Klanttevredenheid</span>
                    <span className="font-medium text-success">4.8/5</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Auto-reply ratio</span>
                    <span className="font-medium text-foreground">{latestStats.autoReplyPct}%</span>
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

// Fix the Pie import issue
const Pie = ({ dataKey, data, cx, cy, outerRadius, label, children }: any) => {
  return (
    <RechartsPieChart>
      {/* This is a placeholder - in a real app you'd use recharts Pie component */}
      <div className="text-center text-muted-foreground">
        Pie chart placeholder
      </div>
    </RechartsPieChart>
  );
};

export default Statistics;