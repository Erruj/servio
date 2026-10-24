import {useState} from 'react';
import {useTranslation} from 'react-i18next';
import {Button} from '@/components/ui/button';
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogFooter} from '@/components/ui/dialog';
import {supabase} from '@/integrations/supabase/client';
import {unsubscribeLinks} from '@/lib/mail-senders';
import type {MailItem} from '@/types';
import {toast} from 'sonner';
import {UserMinus,Archive} from 'lucide-react';
export function UnsubscribeSender({mail,onChanged}:{mail:MailItem;onChanged?:()=>void}) {
 const {t}=useTranslation();
 const [busy,setBusy]=useState(false);
 const [question,setQuestion]=useState(false);
 const [fallback,setFallback]=useState<{https?:string;mailto?:string}|null>(null);
 const links=unsubscribeLinks(mail.listUnsubscribe);
 if(!links.https&&!links.mailto) return null;
 const run=async(action:'unsubscribe'|'archive')=>{
   setBusy(true);
   try {
    const {data,error}=await supabase.functions.invoke('mail-unsubscribe',{body:{email_id:mail.id,action}});
    if(error||data?.errorCode) throw new Error('request');
    if(action==='archive') {toast.success(t('mailSenders.archived'));setQuestion(false);onChanged?.();}
    else if(data?.success) {toast.success(t('mailSenders.success'));setQuestion(true);}
    else setFallback({https:data?.https,mailto:data?.mailto});
   } catch {toast.error(t(action==='archive'?'mailSenders.archiveError':'mailSenders.error'));}
   finally {setBusy(false);}
 };
 return <>
  <Button variant="ghost" className="min-h-11 max-w-full whitespace-normal text-left justify-start text-primary gap-2" disabled={busy} onClick={()=>void run('unsubscribe')}><UserMinus className="h-4 w-4 shrink-0"/>{t('mailSenders.unsubscribe',{sender:mail.from})}</Button>
  <Dialog open={!!fallback} onOpenChange={open=>{if(!open)setFallback(null);}}><DialogContent><DialogHeader><DialogTitle>{t('mailSenders.unsubscribe',{sender:mail.from})}</DialogTitle></DialogHeader><p className="text-sm text-muted-foreground">{t(fallback?.https?'mailSenders.page':'mailSenders.mailtoInfo')}</p><Button asChild className="min-h-11"><a href={fallback?.https||fallback?.mailto} target={fallback?.https?'_blank':undefined} rel="noopener noreferrer" onClick={()=>{setFallback(null);setQuestion(true);}}>{t(fallback?.https?'mailSenders.visit':'mailSenders.mailto')}</a></Button></DialogContent></Dialog>
  <Dialog open={question} onOpenChange={setQuestion}><DialogContent><DialogHeader><DialogTitle>{t('mailSenders.archiveQuestion')}</DialogTitle></DialogHeader><DialogFooter><Button variant="ghost" className="min-h-11" disabled={busy} onClick={()=>setQuestion(false)}>{t('mailSenders.skip')}</Button><Button className="min-h-11 gap-2" disabled={busy} onClick={()=>void run('archive')}><Archive className="h-4 w-4"/>{t('mailSenders.archive')}</Button></DialogFooter></DialogContent></Dialog>
 </>;
}