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
  has_attachments: boolean;
  received_at: string;
  created_at: string;
}

export function useEmailConnections() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [connections, setConnections] = useState<EmailConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchConnections = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('email_connections_safe' as any)
        .select('id, provider, email_address, is_active, last_sync_at, sync_error, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setConnections((data as EmailConnection[]) || []);
    } catch (error) {
      console.error('Error fetching email connections:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

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
      const { error } = await supabase.from('email_connections').delete().eq('id', connectionId);
      if (error) throw error;
      toast({ title: "Mailbox ontkoppeld" });
      await fetchConnections();
    } catch (error) {
      console.error('Disconnect error:', error);
      toast({ title: "Fout", description: "Kon mailbox niet ontkoppelen.", variant: "destructive" });
    }
  };

  const syncEmails = async () => {
    if (!user) return;
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) throw new Error('Niet ingelogd');

    const { data, error } = await supabase.functions.invoke('sync-emails', {
      body: { user_id: user.id },
      headers: { Authorization: `Bearer ${sessionData.session.access_token}` },
    });

    if (error) throw error;
    if (data?.error) throw new Error(data.error);

    const results = Array.isArray(data?.results) ? data.results : [];
    if (results.length === 0) throw new Error('Geen actieve mailboxverbinding gevonden. Koppel je mailbox opnieuw.');

    const successfulSyncs = results.filter((r: { status?: string }) => r.status === 'success');
    if (successfulSyncs.length === 0) {
      const firstError = results.find((r: { error?: string }) => r.error)?.error;
      throw new Error(firstError || 'Synchronisatie mislukt. Koppel je mailbox opnieuw.');
    }

    await fetchConnections();
    return {
      ...data,
      synced_count: successfulSyncs.reduce((t: number, r: { fetched_count?: number }) => t + (r.fetched_count || 0), 0),
    };
  };

  const hasConnections = connections.length > 0;
  const activeConnections = connections.filter(c => c.is_active);

  return { connections, isLoading, hasConnections, activeConnections, startGmailOAuth, startOutlookOAuth, disconnectProvider, syncEmails, refetch: fetchConnections };
}

export interface EmailThread {
  threadId: string;
  emails: Email[];
  subject: string;
  lastEmail: Email;
  unreadCount: number;
  participantCount: number;
}

export function useEmails() {
  const { user } = useAuth();
  const [emails, setEmails] = useState<Email[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const prevEmailCountRef = useRef(0);

  const fetchEmails = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('emails')
        .select('*')
        .eq('user_id', user.id)
        .order('received_at', { ascending: false })
        .limit(200);

      if (error) throw error;
      const newEmails = (data as Email[]) || [];
      
      // Check for new emails and send notification
      if (prevEmailCountRef.current > 0 && newEmails.length > prevEmailCountRef.current) {
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
  }, [user]);

  useEffect(() => { fetchEmails(); }, [fetchEmails]);

  const markAsRead = async (emailId: string) => {
    try {
      await supabase.from('emails').update({ is_read: true }).eq('id', emailId);
      setEmails(prev => prev.map(e => e.id === emailId ? { ...e, is_read: true } : e));
    } catch (error) {
      console.error('Error marking email as read:', error);
    }
  };

  const markMultipleAsRead = async (emailIds: string[]) => {
    try {
      for (const id of emailIds) {
        await supabase.from('emails').update({ is_read: true }).eq('id', id);
      }
      setEmails(prev => prev.map(e => emailIds.includes(e.id) ? { ...e, is_read: true } : e));
    } catch (error) { console.error('Error:', error); }
  };

  const markMultipleAsUnread = async (emailIds: string[]) => {
    try {
      for (const id of emailIds) {
        await supabase.from('emails').update({ is_read: false }).eq('id', id);
      }
      setEmails(prev => prev.map(e => emailIds.includes(e.id) ? { ...e, is_read: false } : e));
    } catch (error) { console.error('Error:', error); }
  };

  const deleteMultiple = async (emailIds: string[]) => {
    try {
      for (const id of emailIds) {
        await supabase.from('emails').delete().eq('id', id);
      }
      setEmails(prev => prev.filter(e => !emailIds.includes(e.id)));
    } catch (error) { console.error('Error:', error); }
  };

  const searchEmails = useCallback(async (query: string) => {
    if (!user || !query.trim()) { fetchEmails(); return; }
    try {
      const q = `%${query}%`;
      const { data, error } = await supabase
        .from('emails')
        .select('*')
        .eq('user_id', user.id)
        .or(`subject.ilike.${q},from_email.ilike.${q},from_name.ilike.${q},snippet.ilike.${q}`)
        .order('received_at', { ascending: false })
        .limit(200);

      if (error) throw error;
      setEmails((data as Email[]) || []);
    } catch (error) {
      console.error('Error searching emails:', error);
    }
  }, [user, fetchEmails]);

  // Group emails into threads
  const threads = groupIntoThreads(emails);

  return { emails, threads, isLoading, refetch: fetchEmails, markAsRead, markMultipleAsRead, markMultipleAsUnread, deleteMultiple, searchEmails };
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
