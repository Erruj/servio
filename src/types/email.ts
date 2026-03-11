// Types for email integration
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

// Re-export MailItem from the canonical types
import type { MailItem } from '@/types/index';

export function emailToMailItem(email: Email): MailItem {
  // Determine priority based on labels
  let priority: 'high' | 'medium' | 'low' = 'medium';
  if (email.labels.includes('IMPORTANT')) priority = 'high';
  
  // Determine category based on content/labels
  let category: 'support' | 'sales' | 'billing' | 'general' = 'general';
  const subjectLower = (email.subject || '').toLowerCase();
  if (subjectLower.includes('support') || subjectLower.includes('help')) category = 'support';
  else if (subjectLower.includes('invoice') || subjectLower.includes('factuur') || subjectLower.includes('payment')) category = 'billing';
  else if (subjectLower.includes('order') || subjectLower.includes('sale') || subjectLower.includes('quote')) category = 'sales';

  return {
    id: email.id,
    from: email.from_name || email.from_email,
    fromEmail: email.from_email,
    subject: email.subject || '(Geen onderwerp)',
    snippet: email.snippet || '',
    body: email.body_html || email.body_text || '',
    date: email.received_at,
    unread: !email.is_read,
    tags: email.labels.filter(l => !['INBOX', 'UNREAD', 'CATEGORY_PERSONAL', 'CATEGORY_UPDATES'].includes(l)),
    priority,
    category,
  };
}
