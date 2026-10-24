import type { MailItem } from '@/types';

export type ComposeMode = 'new' | 'reply' | 'replyAll' | 'forward';
export const DRAFT_SAVE_INTERVAL = 5000;
export const MAX_ATTACHMENT_BYTES = 20 * 1024 * 1024;
export interface ComposeAttachment { name: string; type: string; size: number; content: string }
export interface DraftData {
  followUpDays?: 2 | 3 | 7;
  mode: ComposeMode;
  originalId?: string;
  connectionId: string;
  to: string[];
  cc: string[];
  bcc: string[];
  subject: string;
  html: string;
  quote: string;
  quoteHeading: string;
  attachments: ComposeAttachment[];
  originalAttachments: { id?: string; name: string; url?: string; selected: boolean }[];
}

export function addresses(values: string[]) {
  return [...new Set(values.flatMap(v => v.split(/[,;]/)).map(v => (v.match(/<([^>]+)>/)?.[1] || v).trim().toLowerCase()).filter(Boolean))];
}
export function isEmail(value: string) { return /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(value); }
export function composeSubject(subject: string, mode: ComposeMode) {
  if (mode === 'new') return subject;
  const bare = subject.replace(/^(?:(?:re|fwd|fw)\s*:\s*)+/i, '');
  return `${mode === 'forward' ? 'Fwd' : 'Re'}: ${bare}`;
}
export function composeRecipients(mail: MailItem | undefined, mode: ComposeMode, ownAddresses: string[]) {
  if (!mail || mode === 'new' || mode === 'forward') return { to: [], cc: [] };
  const own = new Set(addresses(ownAddresses));
  const sender = addresses([mail.fromEmail || mail.from]);
  const to = addresses(mode === 'replyAll' ? [...sender, ...mail.to] : sender).filter(v => !own.has(v));
  const cc = mode === 'replyAll' ? addresses(mail.cc || []).filter(v => !own.has(v) && !to.includes(v)) : [];
  return { to, cc };
}
export function canReplyAll(mail: MailItem, own: string[]) {
  const all = composeRecipients(mail, 'replyAll', own);
  return all.to.length + all.cc.length > 1;
}
export function attachmentFits(existing: { size: number }[], bytes: number) {
  return existing.reduce((sum, att) => sum + att.size, 0) + bytes <= MAX_ATTACHMENT_BYTES;
}
export function escapeComposeHtml(text: string) {
  return text.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] || c));
}
export function textToComposeHtml(text: string) { return escapeComposeHtml(text).replace(/\n/g, '<br>'); }