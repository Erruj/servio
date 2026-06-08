import { useState, useEffect, useRef, lazy, Suspense, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { MailItem } from '@/types';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Topbar } from '@/components/Topbar';
import { MailList } from '@/components/MailList';
import { ComposeEmail } from '@/components/ComposeEmail';
import { RateLimitBanner } from '@/components/RateLimitBanner';
import { HelpTooltip } from '@/components/HelpTooltip';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Loader2, Mail, RefreshCw, Sparkles, PenSquare, Bell, Keyboard } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { useEmailConnections, useEmails, requestNotificationPermission } from '@/hooks/useEmailConnections';
import { emailToMailItem } from '@/types/email';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Helmet } from 'react-helmet-async';


const MailDetail = lazy(() => import('@/components/MailDetail').then(module => ({ default: module.MailDetail })));

const AUTO_SYNC_INTERVAL = 5 * 60 * 1000;

const Inbox = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [selectedMail, setSelectedMail] = useState<MailItem | null>(null);
  const [searchQuery, setSearchQuery] = useState(() => localStorage.getItem('servio_inbox_search') || '');
  const initialFilter = searchParams.get('filter') || localStorage.getItem('servio_inbox_filter') || 'all';
  const [filter, setFilter] = useState(initialFilter);
  const [isSyncing, setIsSyncing] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const syncIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { connections, hasConnections, syncEmails, isLoading: connectionsLoading } = useEmailConnections();
  const { emails, isLoading: emailsLoading, refetch: refetchEmails, markAsRead, markMultipleAsRead, markMultipleAsUnread, deleteMultiple, searchEmails } = useEmails();

  const mails: MailItem[] = emails.map(emailToMailItem);

  // Request notification permission on mount
  useEffect(() => { requestNotificationPermission(); }, []);

  // Keyboard shortcuts
  const shortcutsList = useMemo(() => [
    { key: 'c', description: 'Nieuwe email', action: () => setComposeOpen(true) },
    { key: 'r', description: 'Sync/refresh', action: () => handleSync() },
    { key: 'j', description: 'Volgende email', action: () => {
      const idx = mails.findIndex(m => m.id === selectedMail?.id);
      if (idx < mails.length - 1) handleMailSelect(mails[idx + 1]);
    }},
    { key: 'k', description: 'Vorige email', action: () => {
      const idx = mails.findIndex(m => m.id === selectedMail?.id);
      if (idx > 0) handleMailSelect(mails[idx - 1]);
    }},
    { key: '/', description: 'Zoeken', action: () => document.querySelector<HTMLInputElement>('input[placeholder*="Zoek"]')?.focus() },
    { key: '?', shift: true, description: 'Sneltoetsen tonen', action: () => setShowShortcuts(true) },
    { key: 'Escape', description: 'Sluit dialoog', action: () => { setShowShortcuts(false); setComposeOpen(false); } },
  ], [mails, selectedMail]);
  useKeyboardShortcuts(shortcutsList);

  // Handle search with debounce — query database
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
    localStorage.setItem('servio_inbox_search', query);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      if (query.trim().length >= 2) {
        searchEmails(query);
      } else if (query.trim().length === 0) {
        refetchEmails();
      }
    }, 300);
  }, [searchEmails, refetchEmails]);

  useEffect(() => {
    const connected = searchParams.get('connected');
    if (connected) {
      const providerName = connected === 'gmail' ? 'Gmail' : connected === 'outlook' ? 'Outlook' : 'mailbox';
      toast({ title: "✅ Mailbox gekoppeld!", description: `Je ${providerName} is gekoppeld. Emails worden nu gesynchroniseerd...` });
      handleSync();
    }
  }, [searchParams]);

  useEffect(() => {
    if (hasConnections) {
      syncIntervalRef.current = setInterval(async () => {
        try { await syncEmails(); await refetchEmails(); } catch { /* silent */ }
      }, AUTO_SYNC_INTERVAL);
    }
    return () => { if (syncIntervalRef.current) clearInterval(syncIntervalRef.current); };
  }, [hasConnections, syncEmails, refetchEmails]);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const syncPromise = (async () => { await syncEmails(); await refetchEmails(); return { completed: true }; })();
      const timeoutPromise = new Promise<{ completed: false }>((resolve) => setTimeout(() => resolve({ completed: false }), 15000));
      const result = await Promise.race([syncPromise, timeoutPromise]);
      
      if (result.completed) {
        toast({ title: "📧 Emails bijgewerkt", description: "Je inbox is gesynchroniseerd." });
      } else {
        toast({ title: "📧 Emails worden op de achtergrond gesynchroniseerd", description: "Dit kan een moment duren. Je inbox wordt automatisch bijgewerkt." });
        syncPromise.then(() => refetchEmails()).catch(() => {});
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Onbekende fout";
      const isAuthError = msg.toLowerCase().includes('token') || msg.toLowerCase().includes('auth') || msg.toLowerCase().includes('ingelogd');
      const isConnectionError = msg.toLowerCase().includes('koppel') || msg.toLowerCase().includes('connecti');
      
      toast({ 
        title: isAuthError ? "⚠️ Sessie verlopen" : isConnectionError ? "📧 Geen mailbox gevonden" : "Synchronisatie mislukt", 
        description: isAuthError 
          ? "Je sessie is verlopen. Log opnieuw in en probeer het opnieuw." 
          : isConnectionError 
            ? "Koppel eerst je mailbox via Mailbox Instellingen." 
            : `${msg}. Probeer het later opnieuw.`,
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleMailSelect = (mail: MailItem) => {
    setSelectedMail(mail);
    localStorage.setItem('servio_inbox_last_email', mail.id);
    if (mail.unread) markAsRead(mail.id);
  };

  const handleFilterChange = (f: string) => {
    setFilter(f);
    localStorage.setItem('servio_inbox_filter', f);
  };

  const hasAutoSelectedRef = useRef(false);
  useEffect(() => {
    if (mails.length > 0 && !selectedMail && !hasAutoSelectedRef.current) {
      hasAutoSelectedRef.current = true;
      // Only auto-select on desktop; mobile shows list first
      if (window.matchMedia('(min-width: 1024px)').matches) {
        const lastId = localStorage.getItem('servio_inbox_last_email');
        const restored = lastId ? mails.find(m => m.id === lastId) : null;
        setSelectedMail(restored || mails[0]);
      }
    }
  }, [mails, selectedMail]);

  const isLoading = connectionsLoading || emailsLoading;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Helmet>
        <title>Inbox – Servio</title>
        <meta name="description" content="Je AI-gestuurde Servio inbox: e-mails categoriseren, beantwoorden en prioriteren." />
        <meta name="robots" content="noindex, nofollow" />
        <link rel="canonical" href="https://getservio.co/app" />
        <meta property="og:title" content="Inbox – Servio" />
        <meta property="og:url" content="https://getservio.co/app" />
      </Helmet>
      <Header user={user} onLogout={signOut} />
      <RateLimitBanner />
      
      <div className="flex-1 flex">
        <Sidebar />
        
        <div className="flex-1 flex flex-col">
          <div className="flex items-center border-b border-border">
            <div className="pl-4 flex items-center gap-2">
              <Button onClick={() => setComposeOpen(true)} size="sm" className="gap-2">
                <PenSquare className="h-4 w-4" />
                <span className="hidden sm:inline">Nieuwe e-mail</span>
              </Button>
              {'Notification' in window && Notification.permission === 'default' && (
                <Button variant="ghost" size="sm" onClick={requestNotificationPermission} title="Notificaties inschakelen">
                  <Bell className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="flex-1">
              <Topbar onSearchChange={handleSearchChange} onFilterChange={handleFilterChange} />
            </div>
            {hasConnections && (
              <div className="pr-4 flex items-center gap-1">
                <Button variant="outline" size="sm" onClick={handleSync} disabled={isSyncing}>
                  {isSyncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  <span className="ml-2 hidden sm:inline">Sync</span>
                </Button>
                <HelpTooltip
                  tipKey="inbox-sync"
                  title="Synchroniseren"
                  text="Haalt nieuwe emails op uit je gekoppelde mailbox. Dit gebeurt ook automatisch elke paar minuten."
                />
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="flex-1 flex">
              <div className="w-[340px] min-w-[340px] border-r border-border bg-card">
                <div className="p-6 border-b border-border bg-secondary/30">
                  <div className="h-6 w-40 bg-muted rounded animate-pulse mb-2" />
                  <div className="h-4 w-56 bg-muted/60 rounded animate-pulse" />
                </div>
                <div className="divide-y divide-border">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="p-5 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-muted animate-pulse" />
                        <div className="flex-1 space-y-1.5">
                          <div className="h-3 w-24 bg-muted rounded animate-pulse" />
                          <div className="h-2.5 w-16 bg-muted/60 rounded animate-pulse" />
                        </div>
                      </div>
                      <div className="h-3.5 w-3/4 bg-muted rounded animate-pulse" />
                      <div className="h-3 w-full bg-muted/60 rounded animate-pulse" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
                  <Mail className="h-5 w-5 mr-2" /> Mailbox koppelen
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
                <div className="w-[340px] min-w-[340px] flex flex-col">
                  {/* Priority Inbox - top 3 urgent unread */}
                  {(() => {
                    const priority = mails
                      .filter(m => m.unread && (m.aiUrgency === 'Hoog' || m.customerSentiment === 'unhappy'))
                      .slice(0, 3);
                    if (priority.length === 0) return null;
                    return (
                      <div className="border-b border-border bg-destructive/5 px-3 py-2">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-xs">⚡</span>
                          <span className="text-xs font-semibold text-destructive uppercase tracking-wide">Prioriteit inbox</span>
                          <span className="text-xs text-muted-foreground">({priority.length})</span>
                        </div>
                        <div className="space-y-1">
                          {priority.map(m => (
                            <button
                              key={m.id}
                              onClick={() => handleMailSelect(m)}
                              className={`w-full text-left px-2 py-1.5 rounded text-xs hover:bg-background transition ${selectedMail?.id === m.id ? 'bg-background' : ''}`}
                            >
                              <div className="flex items-center gap-2">
                                {m.customerSentiment === 'unhappy' && <span className="text-xs">🔴</span>}
                                <span className="font-medium truncate flex-1">{m.from}</span>
                              </div>
                              <div className="text-muted-foreground truncate text-[11px]">{m.subject}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                  <div className="flex-1 overflow-hidden">
                    <MailList mails={mails} selectedMailId={selectedMail?.id} onSelectMail={handleMailSelect} searchQuery={searchQuery} filter={filter} className="h-full"
                      onMarkAsRead={markMultipleAsRead} onMarkAsUnread={markMultipleAsUnread} onDeleteMultiple={deleteMultiple} />
                  </div>
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
                  <div className="flex-1 flex flex-col min-w-0">
                    <div className="p-3 border-b border-border flex items-center justify-between gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setSelectedMail(null)}>← Terug</Button>
                      {hasConnections && (
                        <Button variant="outline" size="sm" onClick={handleSync} disabled={isSyncing}>
                          {isSyncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                        </Button>
                      )}
                    </div>
                    <Suspense fallback={<div className="h-full bg-card flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
                      <MailDetail mail={selectedMail} className="flex-1 min-w-0" />
                    </Suspense>
                  </div>
                ) : (
                  <>
                    {hasConnections && (
                      <div className="p-3 border-b border-border flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-foreground">Inbox</span>
                        <Button variant="outline" size="sm" onClick={handleSync} disabled={isSyncing} className="gap-2">
                          {isSyncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                          <span>Sync</span>
                        </Button>
                      </div>
                    )}
                    <MailList mails={mails} selectedMailId={selectedMail?.id} onSelectMail={handleMailSelect} searchQuery={searchQuery} filter={filter} className="flex-1"
                      onMarkAsRead={markMultipleAsRead} onMarkAsUnread={markMultipleAsUnread} onDeleteMultiple={deleteMultiple} />
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <ComposeEmail open={composeOpen} onOpenChange={setComposeOpen} hasConnection={hasConnections} />

      {/* Keyboard shortcuts dialog */}
      <Dialog open={showShortcuts} onOpenChange={setShowShortcuts}>
        <DialogContent>
          <DialogHeader><DialogTitle>⌨️ Sneltoetsen</DialogTitle></DialogHeader>
          <div className="space-y-2">
            {[
              { key: 'C', desc: 'Nieuwe email' }, { key: 'R', desc: 'Sync/refresh' },
              { key: 'J', desc: 'Volgende email' }, { key: 'K', desc: 'Vorige email' },
              { key: '/', desc: 'Zoeken' }, { key: 'Shift+?', desc: 'Sneltoetsen tonen' },
              { key: 'Esc', desc: 'Sluit dialoog' },
            ].map((s, i) => (
              <div key={i} className="flex items-center justify-between text-sm py-1">
                <span className="text-muted-foreground">{s.desc}</span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">{s.key}</kbd>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default Inbox;
