import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Mail, CheckCircle, Loader2, RefreshCw, Trash2, AlertCircle, Link2 } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { useEmailConnections } from '@/hooks/useEmailConnections';
import { ImapConnectionModal } from '@/components/ImapConnectionModal';

const MailboxSetup = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [connectingProvider, setConnectingProvider] = useState<string | null>(null);
  const [imapModalOpen, setImapModalOpen] = useState(false);

  const {
    connections,
    isLoading,
    startGmailOAuth,
    startOutlookOAuth,
    disconnectProvider,
    syncEmails,
    refetch,
  } = useEmailConnections();

  useEffect(() => {
    const connected = searchParams.get('connected');
    const error = searchParams.get('error');

    if (connected) {
      toast({
        title: "✅ Mailbox gekoppeld!",
        description: `Je ${connected === 'gmail' ? 'Gmail' : 'Outlook'} account is succesvol gekoppeld.`,
      });
      navigate('/mailbox-setup', { replace: true });
    }

    if (error) {
      toast({
        title: "❌ Koppeling mislukt",
        description: `Er is een fout opgetreden: ${error}`,
        variant: "destructive",
      });
      navigate('/mailbox-setup', { replace: true });
    }
  }, [searchParams, toast, navigate]);

  const handleConnectGmail = async () => {
    setConnectingProvider('gmail');
    try {
      await startGmailOAuth();
    } finally {
      setConnectingProvider(null);
    }
  };

  const handleConnectOutlook = async () => {
    setConnectingProvider('outlook');
    try {
      await startOutlookOAuth();
    } finally {
      setConnectingProvider(null);
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'gmail': return '📧';
      case 'outlook': return '📨';
      case 'imap': return '🔗';
      default: return '📬';
    }
  };

  const getProviderName = (provider: string) => {
    switch (provider) {
      case 'gmail': return 'Gmail';
      case 'outlook': return 'Outlook';
      case 'imap': return 'IMAP';
      default: return provider;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header user={user} onLogout={signOut} />

      <div className="flex-1 flex">
        <Sidebar />

        <div className="flex-1 overflow-y-auto">
          <div className="p-8 space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button variant="ghost" onClick={() => navigate('/app')} className="p-2">
                  <ArrowLeft className="h-5 w-5" />
                  Terug
                </Button>
                <div>
                  <h1 className="text-3xl font-bold text-foreground">📧 Mailbox Koppelen</h1>
                  <p className="text-lg text-muted-foreground mt-2">
                    Koppel je mailbox om echte emails te ontvangen en met AI te beantwoorden
                  </p>
                </div>
              </div>

              {connections.length > 0 && (
                <Button onClick={syncEmails} variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Synchroniseer nu
                </Button>
              )}
            </div>

            {/* Connected Accounts */}
            {connections.length > 0 && (
              <Card className="border-success/50 shadow-elevated">
                <CardHeader>
                  <CardTitle className="flex items-center text-xl">
                    <CheckCircle className="h-6 w-6 mr-3 text-success" />
                    Gekoppelde accounts
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {connections.map((connection) => (
                    <div
                      key={connection.id}
                      className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="text-2xl">{getProviderIcon(connection.provider)}</div>
                        <div>
                          <p className="font-medium">{connection.email_address}</p>
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <Badge variant="secondary" className="capitalize">
                              {getProviderName(connection.provider)}
                            </Badge>
                            {connection.is_active ? (
                              <span className="text-success">● Actief</span>
                            ) : (
                              <span className="text-destructive">● Inactief</span>
                            )}
                            {connection.last_sync_at && (
                              <span>
                                Laatst gesync: {new Date(connection.last_sync_at).toLocaleString('nl-NL')}
                              </span>
                            )}
                          </div>
                          {connection.sync_error && (
                            <div className="flex items-center mt-1 text-sm text-destructive">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              {connection.sync_error}
                            </div>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => disconnectProvider(connection.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Ontkoppelen
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Provider Selection */}
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-4">
                {connections.length > 0 ? '➕ Nog een mailbox toevoegen' : '⚙️ Koppel je mailbox'}
              </h2>
              <p className="text-muted-foreground mb-6">
                Kies een provider om je emails te synchroniseren
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Gmail */}
                <Card className="shadow-card hover:shadow-elevated transition-all duration-200">
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <div className="text-3xl p-2 rounded-lg bg-primary/10 text-primary">📧</div>
                      <div>
                        <CardTitle>Gmail</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">Google Gmail koppelen</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        {['OAuth 2.0', 'Auto-sync', 'Volledige integratie'].map((feature, i) => (
                          <Badge key={i} variant="outline" className="text-xs">{feature}</Badge>
                        ))}
                      </div>
                      <Button
                        className="w-full"
                        onClick={handleConnectGmail}
                        disabled={connectingProvider === 'gmail' || isLoading}
                      >
                        {connectingProvider === 'gmail' ? (
                          <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Verbinden...</>
                        ) : (
                          <><Mail className="h-4 w-4 mr-2" />Koppel Gmail</>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* IMAP - Any Provider */}
                <Card className="shadow-card hover:shadow-elevated transition-all duration-200 border-primary/30">
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <div className="text-3xl p-2 rounded-lg bg-primary/10 text-primary">🔗</div>
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          Andere e-mail
                          <Badge className="bg-primary/20 text-primary text-[10px]">Universeel</Badge>
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">IMAP/SMTP koppeling</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        {['Alle providers', 'IMAP/SMTP', 'Versleuteld'].map((feature, i) => (
                          <Badge key={i} variant="outline" className="text-xs">{feature}</Badge>
                        ))}
                      </div>
                      <Button className="w-full" onClick={() => setImapModalOpen(true)}>
                        <Link2 className="h-4 w-4 mr-2" />
                        Koppel via IMAP
                      </Button>
                      <p className="text-xs text-muted-foreground text-center">
                        Werkt met Namecheap, Zoho, Yahoo en meer
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Outlook */}
                <Card className="shadow-card hover:shadow-elevated transition-all duration-200">
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <div className="text-3xl p-2 rounded-lg bg-primary/10 text-primary">📨</div>
                      <div>
                        <CardTitle>Microsoft Outlook</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">Outlook / Microsoft 365 koppelen</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        {['OAuth 2.0', 'Auto-sync', 'Volledige integratie'].map((feature, i) => (
                          <Badge key={i} variant="outline" className="text-xs">{feature}</Badge>
                        ))}
                      </div>
                      <Button
                        className="w-full"
                        onClick={handleConnectOutlook}
                        disabled={connectingProvider === 'outlook' || isLoading}
                      >
                        {connectingProvider === 'outlook' ? (
                          <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Verbinden...</>
                        ) : (
                          <><Mail className="h-4 w-4 mr-2" />Koppel Outlook</>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
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
                  <Button variant="outline" onClick={() => navigate('/contact')}>
                    💬 Contact Support
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <ImapConnectionModal
        open={imapModalOpen}
        onOpenChange={setImapModalOpen}
        onConnected={() => {
          refetch();
          setImapModalOpen(false);
        }}
      />

      <Footer />
    </div>
  );
};

export default MailboxSetup;
