import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Mail, CheckCircle, Loader2, RefreshCw, Trash2, AlertCircle, Link2, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { useEmailConnections } from '@/hooks/useEmailConnections';
import { ImapConnectionModal } from '@/components/ImapConnectionModal';
import { SyncErrorBanner } from '@/components/SyncErrorBanner';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { Crown } from 'lucide-react';


const MailboxSetup = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [searchParams] = useSearchParams();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [connectingProvider, setConnectingProvider] = useState<string | null>(null);
  const [imapModalOpen, setImapModalOpen] = useState(false);

  const {
    connections,
    activeConnections,
    isLoading,
    loadError,

    startGmailOAuth,
    startOutlookOAuth,
    disconnectProvider,
    syncEmails,
    refetch,
  } = useEmailConnections();

  const { limits, tierLabel } = useFeatureAccess();
  const maxMailboxes = limits.maxMailboxes;
  const mailboxLimitReached =
    maxMailboxes !== null && activeConnections.length >= maxMailboxes;
  const limitMessage =
    maxMailboxes !== null
      ? t('mailboxLimitMessage', { count: maxMailboxes, tier: tierLabel })
      : '';

  useEffect(() => {
    const connected = searchParams.get('connected');
    const error = searchParams.get('error');

    if (connected) {
      toast({
        title: t('mailboxConnected'),
        description: t('mailboxConnectedAccount', { provider: connected === 'gmail' ? 'Gmail' : 'Outlook' }),
      });
      navigate('/mailbox-setup', { replace: true });
    }

    if (error) {
      if (error === 'mailbox_limit_reached') {
        toast({
          title: t('mailboxLimitReached'),
          description: t('mailboxLimitReachedDesc'),
          variant: "destructive",
        });
      } else {
        toast({
          title: t('connectionFailed'),
          description: t('connectionFailedDesc', { error }),
          variant: "destructive",
        });
      }
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

  const handleReconnect = (provider: string) => {
    if (provider === 'gmail') return handleConnectGmail();
    if (provider === 'outlook') return handleConnectOutlook();
    setImapModalOpen(true);
  };

  const handleManualSync = async () => {
    try {
      await syncEmails();
      toast({ title: t('emailsUpdated'), description: t('mailboxSynced') });
    } catch (error) {
      toast({
        title: t('mailboxSyncFailed'),
        description: error instanceof Error ? error.message : t('unknownErrorRetry'),
        variant: "destructive",
      });
    } finally {
      await refetch();
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

        <div className="flex-1 min-w-0 overflow-y-auto">
          <div className="p-4 sm:p-8 space-y-6 sm:space-y-8">
            {/* Header */}
            <div className="space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-4">
              <div className="flex items-center justify-between gap-2 sm:hidden">
                <Button variant="ghost" onClick={() => navigate('/app')} className="min-h-11 px-2">
                  <ArrowLeft className="h-5 w-5 mr-1" /> {t('ui.back')}
                </Button>
                <div className="flex items-center gap-1">
                  <Button onClick={() => refetch()} variant="ghost" size="icon" className="h-11 w-11" title={t('ui.refreshStatus')} aria-label={t('ui.refreshStatus')}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  {activeConnections.length > 0 && (
                    <Button onClick={handleManualSync} variant="outline" size="icon" className="h-11 w-11" title={t('ui.syncNow')} aria-label={t('ui.syncNow')}>
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4 min-w-0">
                <Button variant="ghost" onClick={() => navigate('/app')} className="p-2 hidden sm:inline-flex shrink-0">
                  <ArrowLeft className="h-5 w-5" /> {t('ui.back')}
                </Button>
                <div className="min-w-0">
                  <h1 className="text-2xl sm:text-3xl font-bold text-foreground break-words">📧 {t('ui.mailboxSetupTitle')}</h1>
                  <p className="text-base sm:text-lg text-muted-foreground mt-2">{t('ui.mailboxSetupDesc')}</p>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-2 shrink-0">
                <Button onClick={() => refetch()} variant="ghost" size="sm" title={t('ui.refreshStatus')}>
                  <RefreshCw className="h-4 w-4 mr-2" /> {t('ui.refreshStatus')}
                </Button>
                {activeConnections.length > 0 && (
                  <Button onClick={handleManualSync} variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" /> {t('ui.syncNow')}
                  </Button>
                )}
              </div>
            </div>

            {loadError && (
              <div role="alert" className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm">
                <div className="flex items-start gap-2">
                  <AlertCircle className="mt-0.5 h-4 w-4 text-destructive" />
                  <div>
                    <p className="font-medium text-destructive">{loadError}</p>
                    <p className="text-muted-foreground">
                      {t('mailboxLoadErrorHint')}
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>
                  {t('retry')}
                </Button>
              </div>
            )}

            {!isLoading && !loadError && activeConnections.length === 0 && (
              <div className="rounded-2xl border border-border bg-secondary/30 p-4 text-sm text-muted-foreground">
                {t('noMailboxConnectedDesc')}
              </div>
            )}

            <SyncErrorBanner connections={connections} className="rounded-2xl border" />

            {/* Connected Accounts */}


            {connections.length > 0 && (
              <Card className="border-success/50 shadow-elevated">
                <CardHeader>
                  <CardTitle className="flex items-center text-xl">
                    <CheckCircle className="h-6 w-6 mr-3 text-success" />
                    {t('connectedAccounts')}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {maxMailboxes === null
                      ? t('connectedMailboxesUnlimited', { count: activeConnections.length, tier: tierLabel })
                      : t('connectedMailboxesLimited', { count: activeConnections.length, max: maxMailboxes, tier: tierLabel })}
                  </p>
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
                              <span className="text-success">● {t('active')}</span>
                            ) : (
                              <span className="text-muted-foreground">● {t('disconnected')}</span>
                            )}
                            {connection.last_sync_at && (
                              <span>
                                {t('lastSynced')}: {new Date(connection.last_sync_at).toLocaleString(i18n.language)}
                              </span>
                            )}
                          </div>
                          {connection.is_active && connection.sync_error && (
                            <div className="flex items-center mt-1 text-sm text-destructive">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              {connection.sync_error}
                            </div>
                          )}
                          {!connection.is_active && (
                            <p className="mt-1 text-sm text-muted-foreground">
                              {t('disconnectedMailboxHistory')}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {connection.is_active && connection.sync_error && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleReconnect(connection.provider)}
                          >
                            <Link2 className="h-4 w-4 mr-1" />
                            {t('reconnect')}
                          </Button>
                        )}
                        {!connection.is_active && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReconnect(connection.provider)}
                          >
                            <Link2 className="h-4 w-4 mr-1" />
                            {t('reconnect')}
                          </Button>
                        )}
                        {connection.is_active && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => disconnectProvider(connection.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            {t('disconnect')}
                          </Button>
                        )}
                      </div>

                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Provider Selection */}
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-4">
                {activeConnections.length > 0 ? `➕ ${t('addAnotherMailbox')}` : `⚙️ ${t('ui.connectMailboxTitle')}`}
              </h2>
              <p className="text-muted-foreground mb-6">
                {t('chooseEmailProvider')}
              </p>

              {mailboxLimitReached && (
                <div
                  role="alert"
                  className="mb-6 rounded-2xl border border-primary/30 bg-primary/5 p-5"
                >
                  <div className="flex items-start gap-3">
                    <Crown className="mt-0.5 h-5 w-5 text-primary" />
                    <div className="space-y-3">
                      <div>
                        <p className="font-medium text-foreground">{t('mailboxLimitReached')}</p>
                        <p className="text-sm text-muted-foreground">{limitMessage}</p>
                      </div>
                      <Button size="sm" onClick={() => navigate('/pricing')}>
                        {t('viewPlans')}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Gmail */}
                <Card className="shadow-card hover:shadow-elevated transition-all duration-200 opacity-70">
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <div className="text-3xl p-2 rounded-lg bg-primary/10 text-primary">📧</div>
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          Gmail
                          <Badge variant="secondary" className="text-xs">{t('comingSoon')}</Badge>
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">{t('connectGmail')}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        {['OAuth 2.0', t('autoSync'), t('fullIntegration')].map((feature, i) => (
                          <Badge key={i} variant="outline" className="text-xs">{feature}</Badge>
                        ))}
                      </div>
                      <Button className="w-full" variant="outline" disabled>
                        <Clock className="h-4 w-4 mr-2" />
                        {t('comingSoon')}
                      </Button>
                      <p className="text-xs text-muted-foreground text-center">
                        {t('gmailVerificationPending')}
                      </p>
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
                          {t('otherEmail')}
                          <Badge className="bg-primary/20 text-primary text-[10px]">{t('universal')}</Badge>
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">{t('imapConnection')}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        {[t('allProviders'), 'IMAP/SMTP', t('encrypted')].map((feature, i) => (
                          <Badge key={i} variant="outline" className="text-xs">{feature}</Badge>
                        ))}
                      </div>
                      <Button
                        className="w-full"
                        onClick={() => setImapModalOpen(true)}
                        disabled={mailboxLimitReached}
                        title={mailboxLimitReached ? limitMessage : undefined}
                      >
                        <Link2 className="h-4 w-4 mr-2" />
                        {t('connectViaImap')}
                      </Button>
                      <p className="text-xs text-muted-foreground text-center">
                        {mailboxLimitReached ? limitMessage : t('imapProvidersDesc')}
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
                        <p className="text-sm text-muted-foreground mt-1">{t('connectOutlook')}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        {['OAuth 2.0', t('autoSync'), t('fullIntegration')].map((feature, i) => (
                          <Badge key={i} variant="outline" className="text-xs">{feature}</Badge>
                        ))}
                      </div>
                      <Button
                        className="w-full"
                        onClick={handleConnectOutlook}
                        disabled={connectingProvider === 'outlook' || isLoading || mailboxLimitReached}
                        title={mailboxLimitReached ? limitMessage : undefined}
                      >
                        {connectingProvider === 'outlook' ? (
                          <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{t('connecting')}</>
                        ) : (
                          <><Mail className="h-4 w-4 mr-2" />{t('connectOutlookButton')}</>
                        )}
                      </Button>
                      {mailboxLimitReached && (
                        <p className="text-xs text-muted-foreground text-center">{limitMessage}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Help Section */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-xl">❓ {t('needHelp')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  {t('mailboxHelpDesc')}
                </p>
                <div className="flex space-x-4">
                  <Button variant="outline" onClick={() => navigate('/contact')}>
                    💬 {t('contactSupport')}
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
