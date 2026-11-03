import { z } from 'zod';
import { isSalesInvoice, type InvoiceRow } from './finance';

export const commercialSchema = z.object({
  lines: z.array(z.object({ description: z.string().min(1).max(500), quantity: z.number().positive().max(1000000) })).max(30),
  requested_date: z.string().max(100).nullable(),
  payment_confirmed: z.boolean(),
  payment_amount: z.number().positive().max(100000000).nullable(),
  currency: z.string().nullable(),
});
export type CommercialExtraction = z.infer<typeof commercialSchema>;
export type MailQuotePrefill = { userId: string; customerId: string; subject: string; extraction: CommercialExtraction };
export type MailTimePrefill = { userId: string; customerId: string; subject: string };
export function quotePrefill(value: MailQuotePrefill) {
  return { customerId: value.customerId, description: value.subject, notes: value.extraction.requested_date || '',
    lines: value.extraction.lines.map((line, sort_order) => ({ ...line, unit_price: 0, vat_rate: 21, total: 0, sort_order })) };
}
export function paymentMatch<T extends InvoiceRow & { status?: string | null }>(invoices: T[], customerId: string, extraction: CommercialExtraction): T | null {
  if (!extraction.payment_confirmed || extraction.currency !== 'EUR' || extraction.payment_amount === null) return null;
  const amount = Math.round(extraction.payment_amount * 100);
  const matches = invoices.filter(i => isSalesInvoice(i) && i.customer_id === customerId && ['pending', 'overdue'].includes(i.status || '') && Number.isFinite(Number(i.amount)) && Math.round(Number(i.amount) * 100) === amount);
  return matches.length === 1 ? matches[0] : null;
}