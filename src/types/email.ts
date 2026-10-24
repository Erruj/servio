// Types for email integration
import type { MailItem } from '@/types/index';

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
  list_unsubscribe?: string | null;
  list_unsubscribe_post?: string | null;
  snoozed_until?: string | null;
  follow_up_pending?: boolean;
  inbox_returned_at?: string | null;
  send_at?: string | null;
  send_error?: string | null;
  attachment_metadata?: { id?: string; name: string; sizeKB?: number }[];
  draft_data?: import('@/lib/mail-compose').DraftData | null;
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

export function emailToMailItem(email: Email): MailItem {
  const rel = Array.isArray(email.email_connections_safe)
    ? email.email_connections_safe[0]
    : email.email_connections_safe;

  return {
    listUnsubscribe: email.list_unsubscribe || undefined,
    listUnsubscribePost: email.list_unsubscribe_post || undefined,
    snoozedUntil: email.snoozed_until || undefined,
    followUpPending: email.follow_up_pending,
    inboxReturnedAt: email.inbox_returned_at || undefined,
    draftData: email.draft_data || undefined,
    sendAt:email.send_at || undefined,
    sendError:email.send_error || undefined,
    id: email.id,
    from: email.from_name || email.from_email,
    fromEmail: email.from_email,
    to: email.to_emails || [],
    subject: email.subject || '(Geen onderwerp)',
    snippet: email.snippet || '',
    body: email.body_html || email.body_text || '',
    bodyHtml: email.body_html || undefined,
    bodyText: email.body_text || undefined,
    receivedAt: email.received_at,
    unread: !email.is_read,
    starred: !!email.is_starred,
    folder: email.folder || 'inbox',
    cc: email.cc_emails || [],
    externalId: email.external_id,
    labels: email.labels || [],
    attachments: email.attachment_metadata?.length ? email.attachment_metadata : email.has_attachments ? [{ name: 'attachment' }] : undefined,
    aiCategory: email.ai_category || undefined,
    aiUrgency: email.ai_urgency || undefined,
    customerSentiment: email.customer_sentiment || undefined,
    threadId: email.thread_id,
    connectionId: email.connection_id ?? null,
    connectionEmail: rel?.email_address || undefined,
    connectionProvider: rel?.provider || undefined,
  };
}
