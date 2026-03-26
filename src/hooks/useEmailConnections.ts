import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/hooks/use-toast';

export interface EmailConnection {
  id: string;
  provider: 'gmail' | 'outlook';
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
        .from('email_connections')
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

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  const startGmailOAuth = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        toast({ title: "Niet ingelogd", description: "Log eerst in.", variant: "destructive" });
        return;
      }
      const { data, error } = await supabase.functions.invoke('gmail-oauth', {
        headers: { Authorization: `Bearer ${sessionData.session.access_token}` },
      });
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
      if (!sessionData.session) {
        toast({ title: "Niet ingelogd", description: "Log eerst in.", variant: "destructive" });
        return;
      }
      const { data, error } = await supabase.functions.invoke('outlook-oauth', {
        headers: { Authorization: `Bearer ${sessionData.session.access_token}` },
      });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch (error) {
      console.error('Outlook OAuth error:', error);
      toast({ title: "Fout bij koppelen", description: "Kon Outlook OAuth niet starten.", variant: "destructive" });
    }
  };

  const disconnectProvider = async (connectionId: string) => {
    try {
      const { error } = await supabase
        .from('email_connections')
        .delete()
        .eq('id', connectionId);
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
    if (results.length === 0) {
      throw new Error('Geen actieve mailboxverbinding gevonden. Koppel je mailbox opnieuw.');
    }

    const successfulSyncs = results.filter((result: { status?: string }) => result.status === 'success');
    if (successfulSyncs.length === 0) {
      const firstError = results.find((result: { error?: string }) => result.error)?.error;
      throw new Error(firstError || 'Synchronisatie mislukt. Koppel je mailbox opnieuw.');
    }

    await fetchConnections();
    return {
      ...data,
      synced_count: successfulSyncs.reduce(
        (total: number, result: { fetched_count?: number }) => total + (result.fetched_count || 0),
        0,
      ),
    };
  };

  const hasConnections = connections.length > 0;
  const activeConnections = connections.filter(c => c.is_active);

  return {
    connections,
    isLoading,
    hasConnections,
    activeConnections,
    startGmailOAuth,
    startOutlookOAuth,
    disconnectProvider,
    syncEmails,
    refetch: fetchConnections,
  };
}

export function useEmails() {
  const { user } = useAuth();
  const [emails, setEmails] = useState<Email[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchEmails = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('emails')
        .select('*')
        .eq('user_id', user.id)
        .order('received_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setEmails((data as Email[]) || []);
    } catch (error) {
      console.error('Error fetching emails:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

  const markAsRead = async (emailId: string) => {
    try {
      await supabase.from('emails').update({ is_read: true }).eq('id', emailId);
      setEmails(prev => prev.map(e => e.id === emailId ? { ...e, is_read: true } : e));
    } catch (error) {
      console.error('Error marking email as read:', error);
    }
  };

  return { emails, isLoading, refetch: fetchEmails, markAsRead };
}
