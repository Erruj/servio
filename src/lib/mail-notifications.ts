export type MailNotificationMode='all'|'urgent'|'off';
export function shouldNotify(mode:MailNotificationMode, urgency:string|null|undefined){return mode==='all'||(mode==='urgent'&&['high','hoog'].includes((urgency||'').toLowerCase()));}
