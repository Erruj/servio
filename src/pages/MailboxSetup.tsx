import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Mail, Settings, Zap, CheckCircle } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/hooks/use-toast';

const MailboxSetup = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);

  const providers = [
    {
      id: 'gmail',
      name: 'Gmail',
      icon: '📧',
      description: 'Koppel je Google Gmail account',
      features: ['Auto-sync', 'Real-time updates', 'Volledige integratie'],
      popular: true,
      comingSoon: true
    },
    {
      id: 'outlook',
      name: 'Microsoft Outlook',
      icon: '📨',
      description: 'Koppel je Outlook/Office 365 account',
      features: ['Enterprise support', 'Advanced security', 'Team sync'],
      popular: false,
      comingSoon: true
    },
    {
      id: 'exchange',
      name: 'Exchange Server',
      icon: '🏢',
      description: 'On-premise Exchange server',
      features: ['Custom config', 'Full control', 'Enterprise grade'],
      popular: false,
      comingSoon: true
    },
    {
      id: 'imap',
      name: 'IMAP/POP3',
      icon: '⚙️',
      description: 'Aangepaste IMAP of POP3 configuratie',
      features: ['Any provider', 'Custom settings', 'Full flexibility'],
      popular: false,
      comingSoon: true
    }
  ];

  const handleProviderSelect = (providerId: string) => {
    setSelectedProvider(providerId);
    
    toast({
      title: "🚧 Integratie komt binnenkort",
      description: "We werken hard aan de mailbox integraties. Voor nu kun je de demo-data gebruiken.",
      variant: "default"
    });
  };

  const handleDemoMode = () => {
    toast({
      title: "📧 Demo-modus geactiveerd",
      description: "Je kunt nu de demo-functionaliteit gebruiken met voorbeeldmails.",
    });
    navigate('/');
  };

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
                onClick={() => navigate('/')}
                className="p-2"
              >
                <ArrowLeft className="h-5 w-5" />
                Terug
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-foreground">📧 Mailbox Koppelen</h1>
                <p className="text-lg text-muted-foreground mt-2">
                  Koppel je mailbox om automatisch emails te ontvangen en te beantwoorden
                </p>
              </div>
            </div>

            {/* Demo Mode Card */}
            <Card className="border-primary/50 shadow-elevated">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center text-xl">
                    <Zap className="h-6 w-6 mr-3 text-primary" />
                    🚀 Demo-modus (Aanbevolen)
                  </CardTitle>
                  <Badge className="bg-success text-success-foreground">
                    Direct beschikbaar
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Start direct met voorbeelddata en ontdek alle functionaliteiten zonder configuratie.
                </p>
                <div className="flex flex-wrap gap-2">
                  {['5 voorbeeldmails', 'AI-analyse', 'Auto-antwoorden', 'Volledige demo'].map((feature, index) => (
                    <Badge key={index} variant="secondary" className="bg-primary/10 text-primary">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      {feature}
                    </Badge>
                  ))}
                </div>
                <Button onClick={handleDemoMode} size="lg" className="w-full shadow-card">
                  <Zap className="h-5 w-5 mr-2" />
                  Start Demo-modus
                </Button>
              </CardContent>
            </Card>

            {/* Provider Selection */}
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-4">
                ⚙️ Mailbox Providers
              </h2>
              <p className="text-muted-foreground mb-6">
                Kies je email provider om je mailbox te koppelen (binnenkort beschikbaar)
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {providers.map((provider) => (
                  <Card 
                    key={provider.id}
                    className={`shadow-card hover:shadow-elevated transition-all duration-200 cursor-pointer ${
                      selectedProvider === provider.id ? 'border-primary/50 ring-1 ring-primary/20' : ''
                    } ${provider.comingSoon ? 'opacity-75' : ''}`}
                    onClick={() => handleProviderSelect(provider.id)}
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="text-3xl">{provider.icon}</div>
                          <div>
                            <CardTitle className="flex items-center">
                              {provider.name}
                              {provider.popular && (
                                <Badge className="ml-2 bg-primary text-primary-foreground">
                                  Populair
                                </Badge>
                              )}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                              {provider.description}
                            </p>
                          </div>
                        </div>
                        {provider.comingSoon && (
                          <Badge variant="secondary" className="bg-warning/10 text-warning border-warning/20">
                            Binnenkort
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                          {provider.features.map((feature, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {feature}
                            </Badge>
                          ))}
                        </div>
                        <Button 
                          variant={provider.comingSoon ? "outline" : "default"}
                          className="w-full"
                          disabled={provider.comingSoon}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleProviderSelect(provider.id);
                          }}
                        >
                          {provider.comingSoon ? (
                            <>
                              <Settings className="h-4 w-4 mr-2" />
                              Binnenkort beschikbaar
                            </>
                          ) : (
                            <>
                              <Mail className="h-4 w-4 mr-2" />
                              Koppel {provider.name}
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Help Section */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-xl">❓ Hulp nodig?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Hulp bij het koppelen van je mailbox? Neem contact op met ons support team.
                </p>
                <div className="flex space-x-4">
                  <Button variant="outline">
                    📚 Documentatie
                  </Button>
                  <Button variant="outline">
                    💬 Live Chat
                  </Button>
                  <Button variant="outline">
                    📧 Email Support
                  </Button>
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

export default MailboxSetup;