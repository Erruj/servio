// @ts-nocheck
import { test, expect } from 'bun:test';
import { commercialSchema, quotePrefill, paymentMatch } from './mail-commercial';
const extraction = { lines: [{ description: 'Product', quantity: 4 }], requested_date: '2026-11-10', payment_confirmed: true, payment_amount: 1250, currency: 'EUR' };
const invoice = { id: 'invoice-1', customer_id: 'customer-1', supplier_id: null, amount: 1250, status: 'pending' };
test('quote preserves product and four requested units', () => expect(quotePrefill({userId:'u',customerId:'customer-1',subject:'Aanvraag',extraction}).lines[0]).toEqual({description:'Product',quantity:4,unit_price:0,vat_rate:21,total:0,sort_order:0}));
test('requested date is preserved without changing quote validity', () => expect(quotePrefill({userId:'u',customerId:'c',subject:'Aanvraag',extraction}).notes).toBe('2026-11-10'));
test('EUR 1250 confirms exact customer invoice', () => expect(paymentMatch([invoice],'customer-1',extraction)?.id).toBe('invoice-1'));
test('other customer excluded', () => expect(paymentMatch([invoice],'other',extraction)).toBeNull());
test('different amount excluded', () => expect(paymentMatch([{...invoice,amount:1250.01}],'customer-1',extraction)).toBeNull());
test('paid excluded', () => expect(paymentMatch([{...invoice,status:'paid'}],'customer-1',extraction)).toBeNull());
test('purchase excluded', () => expect(paymentMatch([{...invoice,supplier_id:'supplier'}],'customer-1',extraction)).toBeNull());
test('ambiguous matches never select one', () => expect(paymentMatch([invoice,{...invoice,id:'second'}],'customer-1',extraction)).toBeNull());
test('request for payment is not a confirmation', () => expect(paymentMatch([invoice],'customer-1',{...extraction,payment_confirmed:false})).toBeNull());
test('non EUR confirmation excluded', () => expect(paymentMatch([invoice],'customer-1',{...extraction,currency:'USD'})).toBeNull());
test('invalid quantity rejected', () => expect(commercialSchema.safeParse({...extraction,lines:[{description:'Product',quantity:-1}]}).success).toBe(false));