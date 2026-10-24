export function suppressAutomaticReply(headers:{name:string;value:string}[]){
 const get=(name:string)=>headers.find(h=>h.name.toLowerCase()===name)?.value?.trim().toLowerCase()||'';
 return (get('auto-submitted')!==''&&get('auto-submitted')!=='no')||/bulk|list|junk/.test(get('precedence'))||!!get('list-id')||!!get('x-auto-response-suppress');
}
export function vacationEligible(mail:{from_email:string;list_unsubscribe?:string|null;auto_reply_suppressed?:boolean;ai_category?:string|null}, own:string[]){
 return /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(mail.from_email)&&!mail.list_unsubscribe&&!mail.auto_reply_suppressed&&!/newsletter|nieuwsbrief/i.test(mail.ai_category||'')&&!/(no.?reply|do.?not.?reply|mailer.?daemon|postmaster|bounce|newsletter)/i.test(mail.from_email.split('@')[0])&&!own.some(a=>a.toLowerCase()===mail.from_email.toLowerCase());
}
export const VACATION_COOLDOWN=4*24*60*60*1000;
export function vacationCooldownPassed(last:string,now:number){return now-new Date(last).getTime()>=VACATION_COOLDOWN;}
