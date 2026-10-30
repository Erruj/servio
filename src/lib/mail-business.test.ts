// @ts-nocheck
import {test,expect} from 'bun:test';
import {importableAttachment,attachmentKey,openInvoiceStatuses,openQuoteStatuses} from './mail-business';
import {documentFields} from '../../supabase/functions/mail-business/rules';
test('PDF JPG PNG supported',()=>{expect(['factuur.pdf','scan.JPG','bon.png'].every(importableAttachment)).toBe(true);});
test('executable is not importable',()=>expect(importableAttachment('invoice.exe')).toBe(false));
test('provider attachment ID wins',()=>expect(attachmentKey({id:'graph-id',name:'x.pdf'},2)).toBe('graph-id'));
test('fallback is stable IMAP part ID',()=>expect(attachmentKey({name:'x.pdf'},2)).toBe('part-2'));
test('outstanding invoices exclude paid',()=>expect(openInvoiceStatuses).toEqual(['pending','overdue']));
test('outstanding quotes awaiting answer only',()=>expect(openQuoteStatuses).toEqual(['sent']));
test('invoice OCR preserves concrete amounts and review state',()=>expect(documentFields('invoice',{vendor_name:'Ziggo',total_amount:26.75,vat_amount:4.64,date:'2026-10-24',invoice_number:'ABC'})).toEqual({status:'review',supplier:'Ziggo',amount:26.75,vat_amount:4.64,invoice_date:'2026-10-24',invoice_number:'ABC'}));
test('receipt awaits review',()=>expect(documentFields('receipt',{vendor_name:'Winkel',total_amount:12.5})).toEqual({status:'needs_review',merchant:'Winkel',amount:12.5}));
test('missing OCR values never invent zero totals',()=>expect(documentFields('invoice',{total_amount:null})).toEqual({status:'review'}));
test('nonfinite OCR amount rejected',()=>expect(documentFields('invoice',{total_amount:Infinity})).toEqual({status:'review'}));