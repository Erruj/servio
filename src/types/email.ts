// Types for email integration
import type { MailItem } from '@/types/index';

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

export function emailToMailItem(email: Email): MailItem {
  return {
    id: email.id,
    from: email.from_name || email.from_email,
    to: email.to_emails || [],
    subject: email.subject || '(Geen onderwerp)',
    snippet: email.snippet || '',
    body: email.body_html || email.body_text || '',
    bodyHtml: email.body_html || undefined,
    bodyText: email.body_text || undefined,
    receivedAt: email.received_at,
    unread: !email.is_read,
    labels: email.labels || [],
    attachments: email.has_attachments ? [{ name: 'attachment' }] : undefined,
  };
}
