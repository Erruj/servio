import { useState, useEffect, lazy, Suspense } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MailItem } from '@/types';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Topbar } from '@/components/Topbar';
import { MailList } from '@/components/MailList';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Loader2, Mail, RefreshCw, Sparkles } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { useEmailConnections, useEmails } from '@/hooks/useEmailConnections';
import { emailToMailItem } from '@/types/email';

// Lazy load MailDetail for performance
const MailDetail = lazy(() => import('@/components/MailDetail').then(module => ({ default: module.MailDetail })));

const Inbox = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [selectedMail, setSelectedMail] = useState<MailItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [isSyncing, setIsSyncing] = useState(false);

  const { connections, hasConnections, syncEmails, isLoading: connectionsLoading } = useEmailConnections();
  const { emails, isLoading: emailsLoading, refetch: refetchEmails, markAsRead } = useEmails();

  // Convert database emails to MailItem format
  const mails: MailItem[] = emails.map(emailToMailItem);

  // Handle connection success message
  useEffect(() => {
    const connected = searchParams.get('connected');
    if (connected) {
      toast({
        title: "✅ Mailbox gekoppeld!",
        description: `Je ${connected === 'gmail' ? 'Gmail' : 'Outlook'} is gekoppeld. Emails worden nu gesynchroniseerd...`,
      });
      // Trigger sync after connection
      handleSync();
    }
  }, [searchParams]);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await syncEmails();
      await refetchEmails();
      toast({
        title: "📧 Emails bijgewerkt",
        description: "Je inbox is gesynchroniseerd met je mailbox.",
      });
    } catch {
      toast({
        title: "Sync mislukt",
        description: "Kon emails niet ophalen. Probeer later opnieuw.",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Mark mail as read when selected
  const handleMailSelect = (mail: MailItem) => {
    setSelectedMail(mail);
    
    // Mark as read in database
    if (mail.unread) {
      markAsRead(mail.id);
    }
  };

  // Auto-select first mail when mails load
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
        {/* Sidebar */}
        <Sidebar />
        
        {/* Main content */}
        <div className="flex-1 flex flex-col">
          {/* Topbar with sync button */}
          <div className="flex items-center border-b border-border">
            <div className="flex-1">
              <Topbar 
                onSearchChange={setSearchQuery}
                onFilterChange={setFilter}
              />
            </div>
            {hasConnections && (
              <div className="pr-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSync}
                  disabled={isSyncing}
                >
                  {isSyncing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  <span className="ml-2 hidden sm:inline">Sync</span>
                </Button>
              </div>
            )}
          </div>

          {/* Loading state */}
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                <p className="text-muted-foreground">{t('loading')}</p>
              </div>
            </div>
          ) : !hasConnections ? (
            /* Empty state - no connections */
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center max-w-md">
                <div className="p-6 bg-primary/10 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                  <Mail className="h-12 w-12 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-3">
                  Koppel je mailbox
                </h2>
                <p className="text-muted-foreground mb-6">
                  Verbind je Gmail of Outlook account om je emails hier te zien en met AI te beantwoorden.
                </p>
                <Button 
                  size="lg"
                  onClick={() => window.location.href = '/mailbox-setup'}
                >
                  <Mail className="h-5 w-5 mr-2" />
                  Mailbox koppelen
                </Button>
              </div>
            </div>
          ) : mails.length === 0 ? (
            /* Empty state - connected but no emails */
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center max-w-md">
                <div className="p-6 bg-secondary/30 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                  <Sparkles className="h-12 w-12 text-muted-foreground" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-3">
                  Geen emails gevonden
                </h2>
                <p className="text-muted-foreground mb-6">
                  Je inbox is leeg of de eerste synchronisatie is nog bezig. Klik op sync om emails op te halen.
                </p>
                <Button 
                  onClick={handleSync}
                  disabled={isSyncing}
                >
                  {isSyncing ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Emails ophalen
                </Button>
              </div>
            </div>
          ) : (
            /* Content area - Two column layout */
            <div className="flex-1 flex overflow-hidden">
              {/* Desktop layout */}
              <div className="hidden lg:flex flex-1">
                {/* Mail list - Left column */}
                <div className="w-96 min-w-96">
                  <MailList
                    mails={mails}
                    selectedMailId={selectedMail?.id}
                    onSelectMail={handleMailSelect}
                    searchQuery={searchQuery}
                    filter={filter}
                    className="h-full"
                  />
                </div>

                {/* Mail detail with integrated analysis and reply - Right column */}
                <div className="flex-1">
                  <Suspense fallback={
                    <div className="h-full bg-card flex items-center justify-center">
                      <div className="text-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                        <p className="text-muted-foreground">{t('loading')}</p>
                      </div>
                    </div>
                  }>
                    <MailDetail
                      mail={selectedMail}
                      className="h-full"
                    />
                  </Suspense>
                </div>
              </div>

              {/* Mobile layout - simplified mail list */}
              <div className="lg:hidden flex-1 flex flex-col overflow-hidden">
                {selectedMail ? (
                  <div className="flex-1 flex flex-col">
                    <div className="p-4 border-b border-border">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setSelectedMail(null)}
                        className="mb-2"
                      >
                        ← Terug naar inbox
                      </Button>
                    </div>
                    <Suspense fallback={
                      <div className="h-full bg-card flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    }>
                      <MailDetail mail={selectedMail} className="flex-1" />
                    </Suspense>
                  </div>
                ) : (
                  <MailList
                    mails={mails}
                    selectedMailId={selectedMail?.id}
                    onSelectMail={handleMailSelect}
                    searchQuery={searchQuery}
                    filter={filter}
                    className="flex-1"
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Inbox;
