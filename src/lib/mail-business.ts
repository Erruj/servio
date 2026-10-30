export const importableAttachment = (name: string) => /\.(pdf|jpe?g|png)$/i.test(name);
export const attachmentKey = (attachment: {id?:string;name:string}, index:number) => attachment.id || `part-${index}`;
export const openInvoiceStatuses = ['pending','overdue'];
export const openQuoteStatuses = ['sent'];