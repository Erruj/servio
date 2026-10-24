import { describe, expect, test } from 'bun:test';
import { composeRecipients, composeSubject, canReplyAll, attachmentFits, MAX_ATTACHMENT_BYTES, DRAFT_SAVE_INTERVAL } from './mail-compose';
import type { MailItem } from '@/types';

const mail: MailItem = { id: 'm1', from: 'Klant', fromEmail: 'klant@example.nl', to: ['info@getservio.co', 'collega@example.nl'], cc: ['Info@Getservio.co', 'cc@example.nl', 'collega@example.nl'], subject: 'Re: Re: Offerte', body: 'Vraag', snippet: '', receivedAt: '2026-10-24T12:00:00Z', unread: false, labels: [] };
describe('mail composer rules', () => {
  test('reply addresses only the sender', () => expect(composeRecipients(mail, 'reply', ['info@getservio.co'])).toEqual({ to: ['klant@example.nl'], cc: [] }));
  test('reply all excludes own mailboxes and duplicate CC recipients', () => {
    expect(composeRecipients(mail, 'replyAll', ['info@getservio.co'])).toEqual({ to: ['klant@example.nl', 'collega@example.nl'], cc: ['cc@example.nl'] });
    expect(canReplyAll(mail, ['info@getservio.co'])).toBe(true);
    expect(canReplyAll({ ...mail, to: ['info@getservio.co'], cc: [] }, ['info@getservio.co'])).toBe(false);
  });
  test('forward has no recipients', () => expect(composeRecipients(mail, 'forward', [])).toEqual({ to: [], cc: [] }));
  test('subjects never duplicate prefixes', () => {
    expect(composeSubject(mail.subject, 'reply')).toBe('Re: Offerte');
    expect(composeSubject('Fwd: Re: Offerte', 'forward')).toBe('Fwd: Offerte');
  });
  test('attachments allow exactly 20 MB combined, not one byte more', () => {
    expect(MAX_ATTACHMENT_BYTES).toBe(20 * 1024 * 1024);
    expect(attachmentFits([{ size: 10 * 1024 * 1024 }], 10 * 1024 * 1024)).toBe(true);
    expect(attachmentFits([{ size: MAX_ATTACHMENT_BYTES }], 1)).toBe(false);
  });
  test('autosave interval is five seconds', () => expect(DRAFT_SAVE_INTERVAL).toBe(5000));
});