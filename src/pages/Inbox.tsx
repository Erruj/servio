import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MailItem } from '@/types';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Topbar } from '@/components/Topbar';
import { MailList } from '@/components/MailList';
import { ComposeEmail } from '@/components/ComposeEmail';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Loader2, Mail, RefreshCw, Sparkles, PenSquare } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { useEmailConnections, useEmails } from '@/hooks/useEmailConnections';
import { emailToMailItem } from '@/types/email';

const MailDetail = lazy(() => import('@/components/MailDetail').then(module => ({ default: module.MailDetail })));

const AUTO_SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes

const Inbox = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [selectedMail, setSelectedMail] = useState<MailItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [isSyncing, setIsSyncing] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const syncIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { connections, hasConnections, syncEmails, isLoading: connectionsLoading } = useEmailConnections();
  const { emails, isLoading: emailsLoading, refetch: refetchEmails, markAsRead } = useEmails();

  const mails: MailItem[] = emails.map(emailToMailItem);

  // Handle connection success message
  useEffect(() => {
    const connected = searchParams.get('connected');
    if (connected) {
      const providerName = connected === 'gmail' ? 'Gmail' : connected === 'outlook' ? 'Outlook' : 'mailbox';
      toast({
        title: "✅ Mailbox gekoppeld!",
        description: `Je ${providerName} is gekoppeld. Emails worden nu gesynchroniseerd...`,
      });
      handleSync();
    }
  }, [searchParams]);

  // Auto-sync every 5 minutes
  useEffect(() => {
    if (hasConnections) {
      syncIntervalRef.current = setInterval(async () => {
        try {
          await syncEmails();
          await refetchEmails();
        } catch {
          // Silent fail for background sync
        }
      }, AUTO_SYNC_INTERVAL);
    }
    return () => {
      if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
    };
  }, [hasConnections, syncEmails, refetchEmails]);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await syncEmails();
      await refetchEmails();
      toast({ title: "📧 Emails bijgewerkt", description: "Je inbox is gesynchroniseerd." });
    } catch (error) {
      toast({
        title: "Sync mislukt",
        description: error instanceof Error ? error.message : "Kon emails niet ophalen. Probeer later opnieuw.",
        variant: "destructive"
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleMailSelect = (mail: MailItem) => {
    setSelectedMail(mail);
    if (mail.unread) markAsRead(mail.id);
  };

  useEffect(() => {
    if (mails.length > 0 && !selectedMail) {
      setSelectedMail(mails[0]);
    }
  }, [mails, selectedMail]);

  const isLoading = connectionsLoading || emailsLoading;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header user={user} onLogout={signOut} />
      
      <div className="flex-1 flex">
        <Sidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Topbar with compose + sync */}
          <div className="flex items-center border-b border-border">
            <div className="pl-4">
              <Button
                onClick={() => setComposeOpen(true)}
                size="sm"
                className="gap-2"
              >
                <PenSquare className="h-4 w-4" />
                <span className="hidden sm:inline">Nieuwe e-mail</span>
              </Button>
            </div>
            <div className="flex-1">
              <Topbar onSearchChange={setSearchQuery} onFilterChange={setFilter} />
            </div>
            {hasConnections && (
              <div className="pr-4">
                <Button variant="outline" size="sm" onClick={handleSync} disabled={isSyncing}>
                  {isSyncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  <span className="ml-2 hidden sm:inline">Sync</span>
                </Button>
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                <p className="text-muted-foreground">{t('loading')}</p>
              </div>
            </div>
          ) : !hasConnections ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center max-w-md">
                <div className="p-6 bg-primary/10 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                  <Mail className="h-12 w-12 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-3">Koppel je mailbox</h2>
                <p className="text-muted-foreground mb-6">Verbind je mailbox om je emails hier te zien en met AI te beantwoorden.</p>
                <Button size="lg" onClick={() => window.location.href = '/mailbox-setup'}>
                  <Mail className="h-5 w-5 mr-2" />
                  Mailbox koppelen
                </Button>
              </div>
            </div>
          ) : mails.length === 0 ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center max-w-md">
                <div className="p-6 bg-secondary/30 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                  <Sparkles className="h-12 w-12 text-muted-foreground" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-3">Geen emails gevonden</h2>
                <p className="text-muted-foreground mb-6">Klik op sync om emails op te halen.</p>
                <Button onClick={handleSync} disabled={isSyncing}>
                  {isSyncing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                  Emails ophalen
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex overflow-hidden">
              {/* Desktop */}
              <div className="hidden lg:flex flex-1">
                <div className="w-96 min-w-96">
                  <MailList mails={mails} selectedMailId={selectedMail?.id} onSelectMail={handleMailSelect} searchQuery={searchQuery} filter={filter} className="h-full" />
                </div>
                <div className="flex-1">
                  <Suspense fallback={<div className="h-full bg-card flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
                    <MailDetail mail={selectedMail} className="h-full" />
                  </Suspense>
                </div>
              </div>
              {/* Mobile */}
              <div className="lg:hidden flex-1 flex flex-col overflow-hidden">
                {selectedMail ? (
                  <div className="flex-1 flex flex-col">
                    <div className="p-4 border-b border-border">
                      <Button variant="ghost" size="sm" onClick={() => setSelectedMail(null)} className="mb-2">← Terug naar inbox</Button>
                    </div>
                    <Suspense fallback={<div className="h-full bg-card flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
                      <MailDetail mail={selectedMail} className="flex-1" />
                    </Suspense>
                  </div>
                ) : (
                  <MailList mails={mails} selectedMailId={selectedMail?.id} onSelectMail={handleMailSelect} searchQuery={searchQuery} filter={filter} className="flex-1" />
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <ComposeEmail
        open={composeOpen}
        onOpenChange={setComposeOpen}
        hasConnection={hasConnections}
      />
      
      <Footer />
    </div>
  );
};

export default Inbox;
