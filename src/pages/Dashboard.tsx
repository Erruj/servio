import { Sidebar } from '@/components/Sidebar';
import { Topbar } from '@/components/Topbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { dummyStats } from '@/lib/dummy';
import { 
  Mail, 
  Clock, 
  Zap, 
  AlertTriangle, 
  TrendingUp,
  CheckCircle,
  MessageSquare,
  Timer
} from 'lucide-react';

const Dashboard = () => {
  const latestStats = dummyStats[0];
  
  // Calculate urgent emails count (mock data)
  const urgentEmails = 8;
  
  return (
    <div className="h-screen flex bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col">
        <Topbar />
        
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">📊 Dashboard</h1>
            <p className="text-lg text-muted-foreground">
              Overzicht van je support activiteiten vandaag
            </p>
          </div>

          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Mails Today */}
            <Card className="shadow-card hover:shadow-elevated transition-shadow duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  📧 Mails Vandaag
                </CardTitle>
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-3xl font-bold text-foreground">
                  {latestStats.totalMails}
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +12%
                  </Badge>
                  <span className="text-sm text-muted-foreground">vs gisteren</span>
                </div>
              </CardContent>
            </Card>

            {/* AI Auto-Replies */}
            <Card className="shadow-card hover:shadow-elevated transition-shadow duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  ⚡ AI Auto-Replies
                </CardTitle>
                <div className="p-2 bg-warning/10 rounded-lg">
                  <Zap className="h-5 w-5 text-warning" />
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-3xl font-bold text-foreground">
                  {latestStats.autoReplyPct}%
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                    <MessageSquare className="h-3 w-3 mr-1" />
                    {Math.round(latestStats.totalMails * latestStats.autoReplyPct / 100)} mails
                  </Badge>
                  <span className="text-sm text-muted-foreground">automatisch</span>
                </div>
              </CardContent>
            </Card>

            {/* Average Response Time */}
            <Card className="shadow-card hover:shadow-elevated transition-shadow duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  ⏱️ Gem. Reactietijd
                </CardTitle>
                <div className="p-2 bg-accent/10 rounded-lg">
                  <Clock className="h-5 w-5 text-accent" />
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-3xl font-bold text-foreground">
                  {Math.floor(latestStats.avgResponseMins / 60)}u {latestStats.avgResponseMins % 60}m
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
                    <Timer className="h-3 w-3 mr-1" />
                    -8%
                  </Badge>
                  <span className="text-sm text-muted-foreground">verbetering</span>
                </div>
              </CardContent>
            </Card>

            {/* Urgent Emails */}
            <Card className="shadow-card hover:shadow-elevated transition-shadow duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  🚨 Urgente Mails
                </CardTitle>
                <div className="p-2 bg-destructive/10 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-3xl font-bold text-foreground">
                  {urgentEmails}
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="bg-destructive/10 text-destructive border-destructive/20">
                    Hoge prioriteit
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-xl font-semibold flex items-center">
                ✅ Snelle Acties
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 hover:bg-primary/10 transition-colors cursor-pointer">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-primary rounded-lg">
                      <AlertTriangle className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Urgente Mails</h3>
                      <p className="text-sm text-muted-foreground">Bekijk {urgentEmails} openstaande urgente mails</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-success/5 rounded-xl border border-success/10 hover:bg-success/10 transition-colors cursor-pointer">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-success rounded-lg">
                      <CheckCircle className="h-5 w-5 text-success-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Auto-Reply Setup</h3>
                      <p className="text-sm text-muted-foreground">Configureer automatische antwoorden</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-warning/5 rounded-xl border border-warning/10 hover:bg-warning/10 transition-colors cursor-pointer">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-warning rounded-lg">
                      <MessageSquare className="h-5 w-5 text-warning-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Templates</h3>
                      <p className="text-sm text-muted-foreground">Beheer je email templates</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-xl font-semibold flex items-center">
                📝 Recente Activiteit
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { time: '10 min geleden', action: 'AI antwoord verstuurd', subject: 'Retour aanvraag #12345', type: 'success' },
                  { time: '25 min geleden', action: 'Email geanalyseerd', subject: 'Klacht over verzending', type: 'info' },
                  { time: '1 uur geleden', action: 'Template gebruikt', subject: 'Wachtwoord reset verzoek', type: 'primary' },
                  { time: '2 uur geleden', action: 'Urgente mail ontvangen', subject: 'Website error 500', type: 'warning' },
                ].map((activity, index) => (
                  <div key={index} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-secondary/50 transition-colors">
                    <div className={`w-2 h-2 rounded-full ${
                      activity.type === 'success' ? 'bg-success' :
                      activity.type === 'warning' ? 'bg-warning' :
                      activity.type === 'primary' ? 'bg-primary' : 'bg-muted'
                    }`} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-foreground">{activity.action}</span>
                        <span className="text-sm text-muted-foreground">{activity.time}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{activity.subject}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;