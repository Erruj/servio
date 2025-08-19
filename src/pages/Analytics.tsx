import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Clock, 
  Mail,
  Zap,
  CheckCircle,
  AlertTriangle,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { useNavigate } from 'react-router-dom';

const Analytics = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const categoryStats = [
    { category: 'Retour', count: 24, percentage: 32, trend: '+5%', color: 'bg-blue-500' },
    { category: 'Klacht', count: 18, percentage: 24, trend: '-2%', color: 'bg-red-500' },
    { category: 'Factuur', count: 15, percentage: 20, trend: '+8%', color: 'bg-yellow-500' },
    { category: 'Vraag', count: 12, percentage: 16, trend: '+12%', color: 'bg-green-500' },
    { category: 'Technisch', count: 6, percentage: 8, trend: '-1%', color: 'bg-purple-500' }
  ];

  const weeklyStats = [
    { day: 'Ma', mails: 28, resolved: 24, avgTime: '2.3h' },
    { day: 'Di', mails: 35, resolved: 32, avgTime: '1.8h' },
    { day: 'Wo', mails: 42, resolved: 38, avgTime: '2.1h' },
    { day: 'Do', mails: 38, resolved: 35, avgTime: '1.9h' },
    { day: 'Vr', mails: 45, resolved: 41, avgTime: '2.2h' },
    { day: 'Za', mails: 22, resolved: 20, avgTime: '3.1h' },
    { day: 'Zo', mails: 18, resolved: 16, avgTime: '2.8h' }
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header user={user} onLogout={logout} />
      
      <div className="flex-1 flex">
        <Sidebar />
        
        <div className="flex-1 overflow-y-auto">
          <div className="p-8 space-y-8">
            {/* Header */}
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/dashboard')}
                className="p-2"
              >
                <ArrowLeft className="h-5 w-5" />
                Terug
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-foreground">📊 Uitgebreide Analytics</h1>
                <p className="text-lg text-muted-foreground mt-2">
                  Gedetailleerde inzichten in je support activiteiten
                </p>
              </div>
            </div>

            {/* Key Performance Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="shadow-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Totaal Mails (7 dagen)</CardTitle>
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">228</div>
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    <TrendingUp className="h-3 w-3 text-success" />
                    <span className="text-success">+18%</span>
                    <span>vs vorige week</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">AI Auto-Reply Rate</CardTitle>
                  <Zap className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">84%</div>
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    <TrendingUp className="h-3 w-3 text-success" />
                    <span className="text-success">+6%</span>
                    <span>verbetering</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Gem. Resolutie Tijd</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">2.1u</div>
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    <TrendingUp className="h-3 w-3 text-success" />
                    <span className="text-success">-12%</span>
                    <span>sneller</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Klant Tevredenheid</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">4.7/5</div>
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    <TrendingUp className="h-3 w-3 text-success" />
                    <span className="text-success">+0.3</span>
                    <span>verbetering</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Weekly Trend */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-xl flex items-center">
                  📈 Weekoverzicht
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-7 gap-4">
                    {weeklyStats.map((stat, index) => (
                      <div key={index} className="text-center space-y-2">
                        <div className="text-sm font-medium text-muted-foreground">{stat.day}</div>
                        <div className="space-y-1">
                          <div className={`h-20 bg-primary/20 rounded flex items-end justify-center`}>
                            <div 
                              className="w-8 bg-primary rounded-t"
                              style={{ height: `${(stat.mails / 45) * 100}%` }}
                            />
                          </div>
                          <div className="text-xs">
                            <div className="font-medium">{stat.mails}</div>
                            <div className="text-muted-foreground">mails</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-center">
                    <Badge variant="secondary" className="bg-primary/10 text-primary">
                      Gemiddeld 32.3 mails per dag
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Category Breakdown */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-xl flex items-center">
                  🏷️ Categorie Analyse
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categoryStats.map((stat, index) => (
                    <div key={index} className="flex items-center space-x-4">
                      <div className={`w-4 h-4 rounded ${stat.color}`} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">{stat.category}</span>
                          <div className="flex items-center space-x-2">
                            <Badge variant="secondary">{stat.count} mails</Badge>
                            <Badge 
                              variant={stat.trend.startsWith('+') ? "default" : "secondary"}
                              className={stat.trend.startsWith('+') ? "bg-success text-success-foreground" : "bg-muted"}
                            >
                              {stat.trend}
                            </Badge>
                          </div>
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
              </CardContent>
            </Card>

            {/* Performance Insights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center">
                    ⚡ AI Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Automatisch opgelost</span>
                      <Badge className="bg-success text-success-foreground">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        192 mails (84%)
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Menselijke interventie</span>
                      <Badge variant="secondary">
                        <Users className="h-3 w-3 mr-1" />
                        36 mails (16%)
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Accuratie score</span>
                      <Badge className="bg-primary text-primary-foreground">
                        96.3%
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center">
                    🚨 Aandachtspunten
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <AlertTriangle className="h-4 w-4 text-warning" />
                      <div>
                        <div className="text-sm font-medium">Piek op dinsdag</div>
                        <div className="text-xs text-muted-foreground">35% meer mails dan gemiddeld</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Clock className="h-4 w-4 text-primary" />
                      <div>
                        <div className="text-sm font-medium">Weekend reactietijd</div>
                        <div className="text-xs text-muted-foreground">28% langere responstijd</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <TrendingUp className="h-4 w-4 text-success" />
                      <div>
                        <div className="text-sm font-medium">Klacht resolutie</div>
                        <div className="text-xs text-muted-foreground">15% snellere afhandeling</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Analytics;