export const importableAttachment = (name: string) => /\.(pdf|jpe?g|png)$/i.test(name);
export const attachmentKey = (attachment: {id?:string;name:string}, index:number) => attachment.id || `part-${index}`;
export const openInvoiceStatuses = ['pending','overdue'];
export const openQuoteStatuses = ['sent'];
export function documentFields(kind:'invoice'|'receipt', d:Record<string,unknown>) {
 const fields:Record<string,unknown>={status:kind==='invoice'?'review':'needs_review'};
 if(typeof d.vendor_name==='string')fields[kind==='invoice'?'supplier':'merchant']=d.vendor_name.slice(0,200);
 for(const key of kind==='invoice'?['total_amount','vat_amount']:['total_amount'])if(typeof d[key]==='number'&&Number.isFinite(d[key]))fields[key==='total_amount'?'amount':key]=d[key];
 if(typeof d.date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d.date))fields[kind==='invoice'?'invoice_date':'receipt_date']=d.date;
 if(kind==='invoice'){if(typeof d.due_date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d.due_date))fields.due_date=d.due_date;if(typeof d.invoice_number==='string')fields.invoice_number=d.invoice_number.slice(0,100);}
 if(typeof d.description==='string')fields.ai_summary=d.description.slice(0,500);
 return fields;
}