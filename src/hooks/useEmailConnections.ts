import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/hooks/use-toast';

export interface EmailConnection {
  id: string;
  provider: 'gmail' | 'outlook' | 'imap';
  email_address: string;
  is_active: boolean;
  last_sync_at: string | null;
  sync_error: string | null;
  created_at: string;
}

export interface Email {
  id: string;
  connection_id: string;
  external_id: string;
  thread_id: string | null;
  from_email: string;
  from_name: string | null;
  to_emails: string[];
  cc_emails: string[];
  subject: string | null;
  snippet: string | null;
  body_text: string | null;
  body_html: string | null;
  labels: string[];
  is_read: boolean;
  is_starred: boolean;
  folder?: string;
  has_attachments: boolean;
  received_at: string;
  created_at: string;
  ai_category?: string | null;
  ai_urgency?: string | null;
  customer_sentiment?: string | null;
  thread_summary?: string | null;
  thread_summary_updated_at?: string | null;
  email_connections_safe?: { email_address: string | null; provider: string | null } | { email_address: string | null; provider: string | null }[] | null;
}

export function useEmailConnections() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [connections, setConnections] = useState<EmailConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);


  const fetchConnections = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('email_connections_safe' as any)
        .select('id, provider, email_address, is_active, last_sync_at, sync_error, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setConnections((data as unknown as EmailConnection[]) || []);
      setLoadError(null);
    } catch (error) {
      console.error('Error fetching email connections:', error);
      const msg = error instanceof Error ? error.message : 'Onbekende fout';
      setLoadError(`Kon je mailbox-koppelingen niet laden: ${msg}`);
      toast({
        title: 'Koppelingen niet geladen',
        description: `Kon je mailbox-koppelingen niet ophalen: ${msg}. Vernieuw de pagina of probeer het opnieuw.`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);


  useEffect(() => { fetchConnections(); }, [fetchConnections]);

  const startGmailOAuth = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) { toast({ title: "Niet ingelogd", description: "Log eerst in.", variant: "destructive" }); return; }
      const { data, error } = await supabase.functions.invoke('gmail-oauth', { headers: { Authorization: `Bearer ${sessionData.session.access_token}` } });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch (error) {
      console.error('Gmail OAuth error:', error);
      toast({ title: "Fout bij koppelen", description: "Kon Gmail OAuth niet starten.", variant: "destructive" });
    }
  };

  const startOutlookOAuth = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) { toast({ title: "Niet ingelogd", description: "Log eerst in.", variant: "destructive" }); return; }
      const { data, error } = await supabase.functions.invoke('outlook-oauth', { headers: { Authorization: `Bearer ${sessionData.session.access_token}` } });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch (error) {
      console.error('Outlook OAuth error:', error);
      toast({ title: "Fout bij koppelen", description: "Kon Outlook OAuth niet starten.", variant: "destructive" });
    }
  };

  const disconnectProvider = async (connectionId: string) => {
    try {
      const { error } = await supabase.from('email_connections').update({ is_active: false }).eq('id', connectionId);
      if (error) throw error;
      toast({ title: "Mailbox ontkoppeld", description: "Je e-mailhistorie blijft bewaard." });
      await fetchConnections();
    } catch (error) {
      console.error('Disconnect error:', error);
      toast({ title: "Fout", description: "Kon mailbox niet ontkoppelen.", variant: "destructive" });
    }
  };

  const syncEmails = async () => {
    if (!user) return;
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) throw new Error('Je bent niet ingelogd. Log opnieuw in.');

    const invokeOnce = () => supabase.functions.invoke('sync-emails', {
      body: { user_id: user.id },
      headers: { Authorization: `Bearer ${sessionData.session!.access_token}` },
    });

    // Automatic retry once on transient (network / 5xx / timeout) errors
    let response = await invokeOnce();
    let raw = String((response.error as any)?.message || response.data?.error || '');
    const transient = (m: string) => /timeout|network|fetch|failed to fetch|5\d\d|temporarily|unavailable|ECONN/i.test(m);
    if ((response.error || response.data?.error) && transient(raw)) {
      await new Promise(r => setTimeout(r, 1500));
      response = await invokeOnce();
      raw = String((response.error as any)?.message || response.data?.error || '');
    }

    if (response.error) {
      let userMsg = 'Synchronisatie mislukt. Controleer je mailboxverbinding en probeer opnieuw.';
      if (/timeout/i.test(raw)) userMsg = 'De mailserver reageerde te traag. Probeer het zo opnieuw.';
      else if (/unauthor|401|invalid_grant|token|reconnect/i.test(raw)) userMsg = 'Je mailbox-koppeling is verlopen. Koppel je mailbox opnieuw via Instellingen.';
      else if (/network|fetch/i.test(raw)) userMsg = 'Geen verbinding met de sync-service. Controleer je internetverbinding.';
      else if (raw) userMsg = `Synchronisatie mislukt: ${raw}`;
      throw new Error(userMsg);
    }

    const data = response.data;
    if (data?.error) throw new Error(data.error);

    const results = Array.isArray(data?.results) ? data.results : [];
    if (results.length === 0) throw new Error('Geen actieve mailboxverbinding gevonden. Koppel je mailbox opnieuw.');

    const successfulSyncs = results.filter((r: { status?: string }) => r.status === 'success');
    if (successfulSyncs.length === 0) {
      const firstError = results.find((r: { error?: string }) => r.error)?.error;
      throw new Error(firstError || 'Synchronisatie mislukt voor alle mailboxen. Koppel je mailbox opnieuw.');
    }

    await fetchConnections();
    return {
      ...data,
      synced_count: successfulSyncs.reduce((t: number, r: { fetched_count?: number }) => t + (r.fetched_count || 0), 0),
    };
  };

  const activeConnections = connections.filter(c => c.is_active);
  const hasConnections = activeConnections.length > 0;

  return { connections, isLoading, loadError, hasConnections, activeConnections, startGmailOAuth, startOutlookOAuth, disconnectProvider, syncEmails, refetch: fetchConnections };
}

export interface EmailThread {
  threadId: string;
  emails: Email[];
  subject: string;
  lastEmail: Email;
  unreadCount: number;
  participantCount: number;
}

export type MailActionName = 'read' | 'unread' | 'star' | 'unstar' | 'archive' | 'trash' | 'spam' | 'inbox';

export class MailActionError extends Error {}

/** Voert de actie uit in de echte mailbox én in Servio (edge function mail-action). */
async function runMailAction(emailId: string, action: MailActionName): Promise<void> {
  const { data, error } = await supabase.functions.invoke('mail-action', { body: { email_id: emailId, action } });
  if (error) {
    let detail = error.message;
    try { const ctx = (error as any).context; if (ctx?.json) detail = (await ctx.json())?.error || detail; } catch { /* ignore */ }
    throw new MailActionError(detail);
  }
  if (data && (data as any).error) throw new MailActionError((data as any).error);
}

export type EmailFolder = 'inbox' | 'archive' | 'trash' | 'spam' | 'sent' | 'drafts';

export type MailView = 'inbox' | 'starred' | 'drafts' | 'sent' | 'archive' | 'spam' | 'trash';
export type FolderCounts = Record<MailView, number>;

// deno-lint-ignore no-explicit-any
function applyView(query: any, view: MailView) {
  if (view === 'starred') return query.eq('is_starred', true).not('folder', 'in', '(trash,spam)');
  return query.eq('folder', view);
}

export function useEmails(view: MailView = 'inbox') {
  const { user } = useAuth();
  const [emails, setEmails] = useState<Email[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const prevEmailCountRef = useRef(0);

  const fetchEmails = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await applyView(supabase
        .from('emails')
        .select('*, email_connections_safe(email_address, provider)')
        .eq('user_id', user.id), view)
        .order('received_at', { ascending: false })
        .limit(200);

      if (error) throw error;
      const newEmails = (data as Email[]) || [];
      
      // Check for new emails and send notification
      if (view === 'inbox' && prevEmailCountRef.current > 0 && newEmails.length > prevEmailCountRef.current) {
        const newCount = newEmails.length - prevEmailCountRef.current;
        sendBrowserNotification(newCount, newEmails[0]);
      }
      prevEmailCountRef.current = newEmails.length;
      
      setEmails(newEmails);
    } catch (error) {
      console.error('Error fetching emails:', error);
    } finally {
      setIsLoading(false);
    }
    fetchCounts();
  }, [user, view]);

  const [counts, setCounts] = useState<FolderCounts | null>(null);
  const fetchCounts = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase.rpc('get_mail_folder_counts' as any);
    if (!error && data) setCounts(data as unknown as FolderCounts);
  }, [user]);

  useEffect(() => { fetchEmails(); }, [fetchEmails]);

  const markAsRead = async (emailId: string) => { await setReadState(emailId, true); };

  const markMultipleAsRead = async (emailIds: string[]) => {
    await Promise.all(emailIds.map(id => setReadState(id, true)));
  };

  const markMultipleAsUnread = async (emailIds: string[]) => {
    await Promise.all(emailIds.map(id => setReadState(id, false)));
  };

  const deleteMultiple = async (emailIds: string[]) => {
    try {
      for (const id of emailIds) {
        await supabase.from('emails').delete().eq('id', id);
      }
      setEmails(prev => prev.filter(e => !emailIds.includes(e.id)));
    } catch (error) { console.error('Error:', error); }
  };

  const setStarred = async (emailId: string, value: boolean) => {
    setEmails(prev => prev.map(e => e.id === emailId ? { ...e, is_starred: value } : e));
    try { await runMailAction(emailId, value ? 'star' : 'unstar'); fetchCounts(); }
    catch (e) { setEmails(prev => prev.map(m => m.id === emailId ? { ...m, is_starred: !value } : m)); throw e; }
  };

  const setReadState = async (emailId: string, value: boolean) => {
    setEmails(prev => prev.map(e => e.id === emailId ? { ...e, is_read: value } : e));
    try { await runMailAction(emailId, value ? 'read' : 'unread'); fetchCounts(); }
    catch (e) { setEmails(prev => prev.map(m => m.id === emailId ? { ...m, is_read: !value } : m)); throw e; }
  };

  const setLabels = async (emailId: string, labels: string[]) => {
    const { error } = await supabase.from('emails').update({ labels }).eq('id', emailId);
    if (error) throw error;
    setEmails(prev => prev.map(e => e.id === emailId ? { ...e, labels } : e));
  };

  /** Verplaatst mails naar een map (ook in de echte mailbox). Geeft een functie terug die het ongedaan maakt. */
  const moveToFolder = async (emailIds: string[], folder: 'archive' | 'trash' | 'spam' | 'inbox'): Promise<() => Promise<void>> => {
    const snapshot = emails.filter(e => emailIds.includes(e.id));
    const stays = view === 'starred' && (folder === 'archive' || folder === 'inbox');
    setEmails(prev => stays ? prev.map(e => emailIds.includes(e.id) ? { ...e, folder } : e) : prev.filter(e => !emailIds.includes(e.id)));
    try {
      await Promise.all(emailIds.map(id => runMailAction(id, folder)));
    } catch (e) {
      await fetchEmails();
      throw e;
    } finally {
      fetchCounts();
    }
    return async () => {
      const back = (f?: string): MailActionName => (f === 'archive' || f === 'trash' || f === 'spam' ? f : 'inbox');
      try { await Promise.all(snapshot.map(m => runMailAction(m.id, back(m.folder)))); }
      finally { await fetchEmails(); }
    };
  };

  /** Verwijdert alle mails in de prullenbak definitief uit Servio. */
  const emptyTrash = async () => {
    if (!user) return;
    const { error } = await supabase.from('emails').delete().eq('user_id', user.id).eq('folder', 'trash');
    if (error) throw error;
    if (view === 'trash') setEmails([]);
    fetchCounts();
  };

  const searchEmails = useCallback(async (query: string) => {
    if (!user || !query.trim()) { fetchEmails(); return; }
    try {
      const q = `%${query}%`;
      const { data, error } = await applyView(supabase
        .from('emails')
        .select('*, email_connections_safe(email_address, provider)')
        .eq('user_id', user.id), view)
        .or(`subject.ilike.${q},from_email.ilike.${q},from_name.ilike.${q},snippet.ilike.${q}`)
        .order('received_at', { ascending: false })
        .limit(200);

      if (error) throw error;
      setEmails((data as Email[]) || []);
    } catch (error) {
      console.error('Error searching emails:', error);
    }
  }, [user, fetchEmails, view]);

  // Group emails into threads
  const threads = groupIntoThreads(emails);

  return { emails, threads, isLoading, refetch: fetchEmails, markAsRead, markMultipleAsRead, markMultipleAsUnread, deleteMultiple, searchEmails, setStarred, setReadState, setLabels, moveToFolder, emptyTrash, counts, refetchCounts: fetchCounts };
}

function groupIntoThreads(emails: Email[]): EmailThread[] {
  const threadMap = new Map<string, Email[]>();
  
  for (const email of emails) {
    // Use thread_id if available, otherwise normalize subject as thread key
    const key = email.thread_id || normalizeSubject(email.subject || '');
    if (!key) {
      threadMap.set(email.id, [email]);
      continue;
    }
    const existing = threadMap.get(key) || [];
    existing.push(email);
    threadMap.set(key, existing);
  }

  return Array.from(threadMap.entries()).map(([threadId, threadEmails]) => {
    threadEmails.sort((a, b) => new Date(b.received_at).getTime() - new Date(a.received_at).getTime());
    const lastEmail = threadEmails[0];
    const participants = new Set(threadEmails.map(e => e.from_email));
    
    return {
      threadId,
      emails: threadEmails,
      subject: lastEmail.subject || '(Geen onderwerp)',
      lastEmail,
      unreadCount: threadEmails.filter(e => !e.is_read).length,
      participantCount: participants.size,
    };
  }).sort((a, b) => new Date(b.lastEmail.received_at).getTime() - new Date(a.lastEmail.received_at).getTime());
}

function normalizeSubject(subject: string): string {
  return subject.replace(/^(Re|Fw|Fwd|Antw|Doorst):\s*/gi, '').trim().toLowerCase();
}

function sendBrowserNotification(count: number, latestEmail: Email) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  
  try {
    new Notification(`${count} nieuwe email${count > 1 ? 's' : ''}`, {
      body: latestEmail.subject || 'Nieuw bericht',
      icon: '/favicon.ico',
      tag: 'new-email',
    });
  } catch { /* ignore */ }
}

export function requestNotificationPermission() {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'default') {
    Notification.requestPermission();
  }
}
