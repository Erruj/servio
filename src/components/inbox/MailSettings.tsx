import {useEffect,useState} from 'react';
import {useQuery,useMutation,useQueryClient} from '@tanstack/react-query';
import {useTranslation} from 'react-i18next';
import {toast} from 'sonner';
import {Bell,Save} from 'lucide-react';
import {supabase} from '@/integrations/supabase/client';
import {useAuth} from '@/components/AuthProvider';
import {useEmailConnections} from '@/hooks/useEmailConnections';
import {useMailPreferences} from '@/hooks/useMailPreferences';
import {useMailSendPrefs} from '@/hooks/useMailSendPrefs';
import {useMailShortcutPrefs} from '@/hooks/useInboxShortcuts';
import {useEmailImagePrefs,type EmailImageMode} from '@/hooks/useEmailImagePrefs';
import {UNDO_OPTIONS} from '@/lib/mail-schedule';
import type {MailNotificationMode} from '@/lib/mail-notifications';
import {Button} from '@/components/ui/button';
import {Label} from '@/components/ui/label';
import {Input} from '@/components/ui/input';
import {Textarea} from '@/components/ui/textarea';
import {Switch} from '@/components/ui/switch';
import {Select,SelectTrigger,SelectValue,SelectContent,SelectItem} from '@/components/ui/select';
import {Skeleton} from '@/components/ui/skeleton';
import {Separator} from '@/components/ui/separator';
import {BlockedSenders} from './BlockedSenders';
const localDate=(v:string|null|undefined)=>{if(!v)return '';const d=new Date(v);return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16);};
export function MailSettings(){
 const {t}=useTranslation();const {user}=useAuth();const {activeConnections}=useEmailConnections();const prefs=useMailPreferences();const send=useMailSendPrefs();const shortcuts=useMailShortcutPrefs();const images=useEmailImagePrefs();const qc=useQueryClient();
 const [selected,setSelected]=useState('');const [form,setForm]=useState({signature:'',vacation_enabled:false,vacation_start:'',vacation_end:'',vacation_text:''});const [permission,setPermission]=useState(typeof Notification==='undefined'?'unsupported':Notification.permission);
 useEffect(()=>{if(!selected&&activeConnections[0])setSelected(activeConnections[0].id);},[selected,activeConnections]);
 const key=['mailbox-preferences',user?.id,selected];const query=useQuery({queryKey:key,enabled:!!user&&!!selected,queryFn:async()=>{if(!user)return null;const {data,error}=await supabase.from('mailbox_preferences').select('*').eq('user_id',user.id).eq('connection_id',selected).maybeSingle();if(error)throw error;return data;}});
 useEffect(()=>{setForm({signature:query.data?.signature||'',vacation_enabled:query.data?.vacation_enabled||false,vacation_start:localDate(query.data?.vacation_start),vacation_end:localDate(query.data?.vacation_end),vacation_text:query.data?.vacation_text||''});},[query.data,selected]);
 const failure=()=>toast.error(t('mailPrefs.error'));const saved=()=>toast.success(t('mailPrefs.saved'));
 const save=useMutation({mutationFn:async()=>{if(!user||!selected)throw new Error('session');if(form.vacation_enabled&&(!form.vacation_text.trim()||!form.vacation_start||!form.vacation_end||Date.parse(form.vacation_end)<=Date.parse(form.vacation_start)))throw new Error('invalid');const {error}=await supabase.from('mailbox_preferences').upsert({user_id:user.id,connection_id:selected,...form,vacation_start:form.vacation_start?new Date(form.vacation_start).toISOString():null,vacation_end:form.vacation_end?new Date(form.vacation_end).toISOString():null});if(error)throw error;},onSuccess:()=>{void qc.invalidateQueries({queryKey:key});saved();},onError:e=>toast.error(t(e.message==='invalid'?'mailPrefs.invalid':'mailPrefs.error'))});
 const notificationMode=(value:string)=>prefs.update.mutate({notification_mode:value as MailNotificationMode},{onSuccess:saved,onError:failure});
 return <div className="space-y-6">
 <div className="space-y-2"><Label>{t('mailPrefs.defaultSender')}</Label><Select value={prefs.data?.default_connection_id||'auto'} onValueChange={v=>prefs.update.mutate({default_connection_id:v==='auto'?null:v},{onSuccess:saved,onError:failure})}><SelectTrigger className="min-h-11"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="auto">{t('mailPrefs.automatic')}</SelectItem>{activeConnections.map(c=><SelectItem key={c.id} value={c.id}>{c.email_address}</SelectItem>)}</SelectContent></Select></div>
 <Separator/><div className="space-y-3"><Label>{t('mailPrefs.notifications')}</Label><Select value={prefs.data?.notification_mode||'off'} onValueChange={notificationMode}><SelectTrigger className="min-h-11"><SelectValue/></SelectTrigger><SelectContent>{(['all','urgent','off'] as const).map(v=><SelectItem key={v} value={v}>{t(`mailPrefs.${v}`)}</SelectItem>)}</SelectContent></Select>
 <Button variant="outline" disabled={permission==='unsupported'||permission==='denied'||permission==='granted'} onClick={async()=>{const value=await Notification.requestPermission();setPermission(value);if(value==='granted'&&(!prefs.data||prefs.data.notification_mode==='off'))notificationMode('urgent');}}><Bell className="h-4 w-4"/>{t('mailPrefs.enable')}</Button>{['denied','unsupported'].includes(permission)&&<p role="alert" className="text-sm text-muted-foreground">{t(permission==='denied'?'mailPrefs.blocked':'mailPrefs.unsupported')}</p>}</div>
 <Separator/><div className="space-y-2"><Label>{t('mailSchedule.delay')}</Label><Select value={String(send.seconds)} onValueChange={v=>send.update.mutate(Number(v),{onSuccess:saved,onError:failure})}><SelectTrigger className="min-h-11"><SelectValue/></SelectTrigger><SelectContent>{send.seconds===8&&<SelectItem value="8">{t('mailSchedule.defaultDelay')}</SelectItem>}{UNDO_OPTIONS.map(n=><SelectItem key={n} value={String(n)}>{t('mailSchedule.seconds',{count:n})}</SelectItem>)}</SelectContent></Select></div>
 <div className="space-y-2"><Label>{t('emailView.settingLabel')}</Label><Select value={images.mode} onValueChange={v=>images.setMode.mutate(v as EmailImageMode,{onSuccess:saved,onError:failure})}><SelectTrigger className="min-h-11"><SelectValue/></SelectTrigger><SelectContent>{(['ask','always','never'] as const).map(v=><SelectItem key={v} value={v}>{t(`emailView.mode${v[0].toUpperCase()+v.slice(1)}`)}</SelectItem>)}</SelectContent></Select></div>
 <div className="flex items-center justify-between gap-3"><Label htmlFor="mail-shortcuts">{t('inboxControls.pref')}</Label><Switch id="mail-shortcuts" checked={shortcuts.enabled} onCheckedChange={v=>{try{shortcuts.setEnabled(v);saved();}catch{failure();}}}/></div>
 <Separator/>{activeConnections.length===0?<p>{t('mailPrefs.none')}</p>:<><div className="space-y-2"><Label>{t('mailPrefs.mailbox')}</Label><Select value={selected} onValueChange={setSelected}><SelectTrigger className="min-h-11"><SelectValue/></SelectTrigger><SelectContent>{activeConnections.map(c=><SelectItem key={c.id} value={c.id}>{c.email_address}</SelectItem>)}</SelectContent></Select></div>
 {query.isLoading?<Skeleton className="h-48 w-full"/>:query.isError?<div role="alert">{t('mailPrefs.loadError')}<Button variant="outline" onClick={()=>void query.refetch()}>{t('mailPrefs.retry')}</Button></div>:<><div className="space-y-2"><Label htmlFor="mail-signature">{t('mailPrefs.signature')}</Label><Textarea id="mail-signature" value={form.signature} maxLength={10000} onChange={e=>setForm({...form,signature:e.target.value})}/></div>
 <div className="flex items-center justify-between gap-3"><Label htmlFor="mail-vacation">{t('mailPrefs.vacation')}</Label><Switch id="mail-vacation" disabled={!['imap','outlook'].includes(activeConnections.find(c=>c.id===selected)?.provider||'')} checked={form.vacation_enabled} onCheckedChange={v=>setForm({...form,vacation_enabled:v})}/></div>
 {form.vacation_enabled&&<><div className="grid sm:grid-cols-2 gap-3"><div><Label htmlFor="vacation-from">{t('mailPrefs.from')}</Label><Input id="vacation-from" type="datetime-local" value={form.vacation_start} onChange={e=>setForm({...form,vacation_start:e.target.value})}/></div><div><Label htmlFor="vacation-until">{t('mailPrefs.until')}</Label><Input id="vacation-until" type="datetime-local" value={form.vacation_end} onChange={e=>setForm({...form,vacation_end:e.target.value})}/></div></div><Label htmlFor="vacation-text">{t('mailPrefs.text')}</Label><Textarea id="vacation-text" maxLength={10000} value={form.vacation_text} onChange={e=>setForm({...form,vacation_text:e.target.value})}/>{activeConnections.find(c=>c.id===selected)?.provider==='outlook'&&<p className="text-sm text-muted-foreground">{t('mailPrefs.outlookNative')}</p>}</>}
 {query.data?.vacation_error&&<p role="alert" className="text-sm text-destructive">{t('mailPrefs.vacationFailed')}</p>}<Button disabled={save.isPending} onClick={()=>save.mutate()}><Save className="h-4 w-4"/>{t('mailPrefs.save')}</Button></>}
 </>}
 <Separator/><h3 className="text-sm font-semibold">{t('mailSenders.title')}</h3><BlockedSenders/>
 </div>;
}
