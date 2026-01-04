import { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Topbar } from '@/components/Topbar';
import { SubscriptionBanner } from '@/components/SubscriptionBanner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { dummyStats } from '@/lib/dummy';
import { useAuth } from '@/components/AuthProvider';
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
  BarChart3
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [timeFilter, setTimeFilter] = useState('today');
  const latestStats = dummyStats[0];
  
  // Calculate urgent emails count (mock data)
  const urgentEmails = 8;
  
  // Mock comparison data
  const comparisons = {
    today: { mails: 12, response: -8, urgent: 3 },
    week: { mails: 15, response: -12, urgent: -2 },
    month: { mails: 23, response: -15, urgent: 5 },
  };
  
  const currentComparison = comparisons[timeFilter as keyof typeof comparisons];
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header user={user} onLogout={signOut} />
      
      <div className="flex-1 flex">
        <Sidebar />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <Topbar />
          
          <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 space-y-6">
            {/* Subscription Banner */}
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

          {/* Key Metrics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Mails Today */}
            <Card className="shadow-card hover:shadow-elevated transition-all duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
                  Mails {timeFilter === 'today' ? 'Vandaag' : timeFilter === 'week' ? 'Deze Week' : 'Deze Maand'}
                </CardTitle>
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Mail className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-2xl md:text-3xl font-bold text-foreground">
                  {latestStats.totalMails}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary" className={`${currentComparison.mails >= 0 ? 'bg-success/10 text-success border-success/20' : 'bg-destructive/10 text-destructive border-destructive/20'}`}>
                    {currentComparison.mails >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                    {currentComparison.mails >= 0 ? '+' : ''}{currentComparison.mails}%
                  </Badge>
                  <span className="text-xs text-muted-foreground">vs vorige periode</span>
                </div>
              </CardContent>
            </Card>

            {/* AI Auto-Replies */}
            <Card className="shadow-card hover:shadow-elevated transition-all duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
                  AI Auto-Replies
                </CardTitle>
                <div className="p-2 bg-warning/10 rounded-lg">
                  <Zap className="h-4 w-4 md:h-5 md:w-5 text-warning" />
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-2xl md:text-3xl font-bold text-foreground">
                  {latestStats.autoReplyPct}%
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                    <MessageSquare className="h-3 w-3 mr-1" />
                    {Math.round(latestStats.totalMails * latestStats.autoReplyPct / 100)} mails
                  </Badge>
                  <span className="text-xs text-muted-foreground">automatisch</span>
                </div>
              </CardContent>
            </Card>

            {/* Average Response Time */}
            <Card className="shadow-card hover:shadow-elevated transition-all duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
                  Gem. Reactietijd
                </CardTitle>
                <div className="p-2 bg-accent/10 rounded-lg">
                  <Clock className="h-4 w-4 md:h-5 md:w-5 text-accent" />
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-2xl md:text-3xl font-bold text-foreground">
                  {Math.floor(latestStats.avgResponseMins / 60)}u {latestStats.avgResponseMins % 60}m
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
                    <Timer className="h-3 w-3 mr-1" />
                    {currentComparison.response}%
                  </Badge>
                  <span className="text-xs text-muted-foreground">sneller</span>
                </div>
              </CardContent>
            </Card>

            {/* Urgent Emails */}
            <Card className="shadow-card hover:shadow-elevated transition-all duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
                  Urgente Mails
                </CardTitle>
                <div className="p-2 bg-destructive/10 rounded-lg">
                  <AlertTriangle className="h-4 w-4 md:h-5 md:w-5 text-destructive" />
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-2xl md:text-3xl font-bold text-foreground">
                  {urgentEmails}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary" className={`${currentComparison.urgent <= 0 ? 'bg-success/10 text-success border-success/20' : 'bg-warning/10 text-warning border-warning/20'}`}>
                    {currentComparison.urgent > 0 ? '+' : ''}{currentComparison.urgent} vs gisteren
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions - Now functional */}
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
                    <h3 className="font-semibold text-foreground">Urgente Mails</h3>
                    <p className="text-sm text-muted-foreground">{urgentEmails} openstaand</p>
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

          {/* Recent Activity */}
          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Recente Activiteit
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => navigate('/app')}>
                  Bekijk alles
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {[
                  { time: '10 min', action: 'AI antwoord verstuurd', subject: 'Retour aanvraag #12345', type: 'success' },
                  { time: '25 min', action: 'Email geanalyseerd', subject: 'Klacht over verzending', type: 'info' },
                  { time: '1 uur', action: 'Template gebruikt', subject: 'Wachtwoord reset verzoek', type: 'primary' },
                  { time: '2 uur', action: 'Urgente mail ontvangen', subject: 'Website error 500', type: 'warning' },
                ].map((activity, index) => (
                  <div 
                    key={index} 
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => navigate('/app')}
                  >
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      activity.type === 'success' ? 'bg-success' :
                      activity.type === 'warning' ? 'bg-warning' :
                      activity.type === 'primary' ? 'bg-primary' : 'bg-muted-foreground'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-foreground text-sm truncate">{activity.action}</span>
                        <span className="text-xs text-muted-foreground flex-shrink-0">{activity.time}</span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{activity.subject}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Dashboard;