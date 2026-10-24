import {useEffect,useState} from 'react';
import {useTranslation} from 'react-i18next';
import {supabase} from '@/integrations/supabase/client';
import {useAuth} from '@/components/AuthProvider';
import {MailItem} from '@/types';
import {emailToMailItem} from '@/types/email';
import {EmailBodyRenderer} from '@/components/EmailBodyRenderer';
import {Button} from '@/components/ui/button';
import {Skeleton} from '@/components/ui/skeleton';
import {initiallyOpenMessageIds} from '@/lib/mail-search';
import {buildPreview} from '@/lib/emailText';
export function MailConversation({mail,onLatest}:{mail:MailItem;onLatest?:(mail:MailItem)=>void}){
 const {user}=useAuth();const {t,i18n}=useTranslation();const [messages,setMessages]=useState<MailItem[]>([mail]);const [opened,setOpened]=useState<string[]>([mail.id]);const [loading,setLoading]=useState(false);const [error,setError]=useState(false);const [retry,setRetry]=useState(0);
 useEffect(()=>{let cancelled=false;setMessages([mail]);setOpened([mail.id]);setError(false);if(!user||!mail.threadId||!mail.connectionId)return;setLoading(true);(async()=>{try{let items:MailItem[]=[];for(let offset=0;;offset+=100){const {data,error}=await supabase.from('emails').select('*').eq('user_id',user.id).eq('connection_id',mail.connectionId ?? '').eq('thread_id',mail.threadId ?? '').not('folder','in','(drafts,scheduled)').order('received_at',{ascending:true}).order('id',{ascending:true}).range(offset,offset+99);if(error)throw error;if(cancelled)return;items.push(...(data||[]).map(emailToMailItem));if((data||[]).length<100)break;}if(cancelled)return;const result=items.length?items:[mail];setMessages(result);setOpened(initiallyOpenMessageIds(result));const latest=result.find(m=>initiallyOpenMessageIds(result).includes(m.id));if(latest)onLatest?.(latest);}catch{if(!cancelled)setError(true);}finally{if(!cancelled)setLoading(false);}})();return()=>{cancelled=true;};},[user?.id,mail.threadId,mail.connectionId,mail.id,retry]);
 const all=opened.length===messages.length;
 return <section className="divide-y divide-border">
   {loading?<Skeleton className="h-20 w-full"/>:<>
   {error&&<div role="alert" className="text-sm text-destructive">{t('mailSearch.threadError')}<Button variant="ghost" onClick={()=>setRetry(v=>v+1)}>{t('mailSearch.retry')}</Button></div>}
   {messages.length>1&&<Button variant="ghost" className="min-h-11" onClick={()=>setOpened(all?initiallyOpenMessageIds(messages):messages.map(m=>m.id))}>{t(all?'mailSearch.collapse':'mailSearch.expand')}</Button>}
   {messages.map(message=><div key={message.id} className="py-3">
     {messages.length>1&&<Button variant="ghost" aria-expanded={opened.includes(message.id)} className="w-full min-h-11 h-auto text-left justify-start gap-3" onClick={()=>setOpened(prev=>prev.includes(message.id)?prev.filter(id=>id!==message.id):[...prev,message.id])}><div className="min-w-0 flex-1"><p className="font-semibold truncate">{message.from}</p><p className="font-normal text-xs text-muted-foreground truncate">{buildPreview({bodyText:message.bodyText,snippet:message.snippet})}</p></div><time className="text-xs text-muted-foreground shrink-0">{new Intl.DateTimeFormat(i18n.language,{day:'numeric',month:'short',year:'numeric'}).format(new Date(message.receivedAt))}</time></Button>}
     {opened.includes(message.id)&&<EmailBodyRenderer key={message.id} bodyHtml={message.bodyHtml} bodyText={message.bodyText||message.body} fromEmail={message.fromEmail}/>}
   </div>)}</>}
 </section>;
}