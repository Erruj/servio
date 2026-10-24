export function unsubscribeHeaders(headers: {name:string;value:string}[]) {
 const get=(name:string)=>headers.find(h=>h.name.toLowerCase()===name)?.value?.slice(0,16000)||null;
 return {list_unsubscribe:get('list-unsubscribe'),list_unsubscribe_post:get('list-unsubscribe-post')};
}
export function newSenderMail(record:Record<string,unknown>,blocked:Set<string>) {
 return blocked.has(String(record.from_email||'').trim().toLowerCase()) ? {...record,folder:'spam',spam_move_pending:true} : record;
}