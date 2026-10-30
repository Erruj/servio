import {useState} from 'react';
import {useQuery,useQueryClient} from '@tanstack/react-query';
import {useTranslation} from 'react-i18next';
import {Link} from 'react-router-dom';
import {toast} from 'sonner';
import {useAuth} from '@/components/AuthProvider';
import {supabase} from '@/integrations/supabase/client';
import type {MailItem} from '@/types';
import {attachmentKey,importableAttachment,openInvoiceStatuses,openQuoteStatuses} from '@/lib/mail-business';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Skeleton} from '@/components/ui/skeleton';
import {HoverCard,HoverCardTrigger,HoverCardContent} from '@/components/ui/hover-card';
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription,DialogFooter} from '@/components/ui/dialog';
import {Paperclip,FileText,Receipt,UserPlus,Check} from 'lucide-react';

export function SenderCustomer({mail,suggestion=false}:{mail:MailItem;suggestion?:boolean}){
 const {t}=useTranslation();const {user}=useAuth();const qc=useQueryClient();const email=(mail.fromEmail||mail.from).trim().toLowerCase();
 const [open,setOpen]=useState(false);const [cardOpen,setCardOpen]=useState(false);const [saving,setSaving]=useState(false);const [aiBusy,setAiBusy]=useState(false);
 const [form,setForm]=useState({name:mail.from,email,company_name:'',phone:''});
 const key=['mail-customer',user?.id,email];
 const query=useQuery({queryKey:key,enabled:!!user,queryFn:async()=>{
 if(!user)return null;
 const escaped=email.replace(/[\\%_]/g,'\\$&');
 const {data,error}=await supabase.from('customers').select('*').eq('user_id',user.id).ilike('email',escaped).limit(1).maybeSingle();if(error)throw error;if(!data)return null;
 const [invoices,quotes]=await Promise.all([supabase.from('invoices').select('id',{count:'exact',head:true}).eq('user_id',user.id).eq('customer_id',data.id).in('status',openInvoiceStatuses),supabase.from('quotes').select('id',{count:'exact',head:true}).eq('user_id',user.id).eq('customer_id',data.id).in('status',openQuoteStatuses)]);
 if(invoices.error||quotes.error)throw invoices.error||quotes.error;
 return {customer:data,invoices:invoices.count||0,quotes:quotes.count||0};
 }});
 const create=async()=>{setOpen(true);setAiBusy(true);try{const {data,error}=await supabase.functions.invoke('mail-business',{body:{action:'customer',email_id:mail.id}});if(error||data?.errorCode)throw error||new Error('ai');setForm(f=>({...f,company_name:f.company_name||data?.data?.company_name||'',phone:f.phone||data?.data?.phone||''}));}catch{toast.error(t('mailBusiness.aiFailed'));}finally{setAiBusy(false);}};
 const save=async()=>{if(!user||!form.name.trim()||!form.email.trim())return;setSaving(true);try{
 const {data:existing,error:findError}=await supabase.from('customers').select('id').eq('user_id',user.id).ilike('email',form.email.trim().replace(/[\\%_]/g,'\\$&')).limit(1).maybeSingle();if(findError)throw findError;
 if(!existing){const {error}=await supabase.from('customers').insert({...form,name:form.name.trim(),email:form.email.trim(),user_id:user.id});if(error)throw error;}
 await qc.invalidateQueries({queryKey:key});setOpen(false);toast.success(t('mailBusiness.created'));
 }catch{toast.error(t('mailBusiness.error'));}finally{setSaving(false);}};
 const content=query.isLoading?<Skeleton className="h-20 w-full"/>:query.isError?<div role="alert">{t('mailBusiness.loadError')}<Button variant="ghost" onClick={()=>void query.refetch()}>{t('mailBusiness.retry')}</Button></div>:query.data?<div className="space-y-2"><Badge variant="secondary">{t('mailBusiness.known')}</Badge><p className="font-medium">{query.data.customer.company_name||query.data.customer.name}</p><p className="text-sm">{t('mailBusiness.invoices',{count:query.data.invoices})}</p><p className="text-sm">{t('mailBusiness.quotes',{count:query.data.quotes})}</p><Button asChild variant="outline" className="min-h-11"><Link to={`/administration/customers?customer=${query.data.customer.id}`}>{t('mailBusiness.customer')}</Link></Button></div>:<Button variant="outline" className="min-h-11 gap-2" onClick={()=>void create()}><UserPlus className="h-4 w-4"/>{t('mailBusiness.create')}</Button>;
 return <>{suggestion?(query.isSuccess&&!query.data?<div className="flex flex-wrap items-center gap-2"><p className="text-sm text-muted-foreground">{t('mailBusiness.customerSuggestion')}</p>{content}</div>:null):<HoverCard open={cardOpen} onOpenChange={setCardOpen}><HoverCardTrigger asChild><Button variant="ghost" className="min-h-11 px-0 font-semibold max-w-full whitespace-normal text-left" onClick={()=>setCardOpen(v=>!v)}>{mail.from}</Button></HoverCardTrigger><HoverCardContent align="start" className="w-80 max-w-[calc(100vw-2rem)]">{content}</HoverCardContent></HoverCard>}
 <Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle>{t('mailBusiness.create')}</DialogTitle><DialogDescription>{t('mailBusiness.aiReview')}</DialogDescription></DialogHeader>{aiBusy&&<Skeleton className="h-4 w-full"/>}<form onSubmit={e=>{e.preventDefault();void save();}} className="space-y-3">{(['name','email','company_name','phone'] as const).map(field=><div key={field}><Label htmlFor={`mail-customer-${field}`}>{t(`mailBusiness.${field==='company_name'?'company':field}`)}</Label><Input id={`mail-customer-${field}`} required={field==='name'||field==='email'} type={field==='email'?'email':'text'} maxLength={field==='phone'?50:200} value={form[field]} onChange={e=>setForm({...form,[field]:e.target.value})}/></div>)}<DialogFooter><Button type="button" variant="outline" onClick={()=>setOpen(false)}>{t('mailBusiness.cancel')}</Button><Button type="submit" disabled={saving||aiBusy}>{t('mailBusiness.save')}</Button></DialogFooter></form></DialogContent></Dialog></>;
}

export function MailAttachmentActions({mail,suggestion=false}:{mail:MailItem;suggestion?:boolean}){
 const {t}=useTranslation();const {user}=useAuth();const qc=useQueryClient();const [busy,setBusy]=useState<string|null>(null);
 const key=['mail-document-imports',user?.id,mail.id];
 const query=useQuery({queryKey:key,enabled:!!user,refetchInterval:q=>q.state.data?.some(r=>r.status==='processing')?3000:false,queryFn:async()=>{if(!user)return [];const {data,error}=await supabase.from('mail_document_imports').select('*').eq('user_id',user.id).eq('email_id',mail.id);if(error)throw error;return data||[];}});
 const providerAttachments=useQuery({queryKey:['mail-provider-attachments',user?.id,mail.id],enabled:!!user&&!!mail.attachments?.length&&mail.attachments.some(a=>!a.id),staleTime:60000,retry:false,queryFn:async()=>{const {data,error}=await supabase.functions.invoke('mail-business',{body:{action:'attachments',email_id:mail.id}});if(error||data?.errorCode)throw error||new Error('attachment');return data.attachments as {id:string;name:string;sizeKB:number}[];}});
 const add=async(a:string,kind:'invoice'|'receipt')=>{if(busy)return;setBusy(a);try{const {data,error}=await supabase.functions.invoke('mail-business',{body:{action:'document',email_id:mail.id,attachment_key:a,kind}});if(error||data?.errorCode||data?.busy)throw error||new Error('busy');toast[data?.ocrFailed?'warning':'success'](t(data?.ocrFailed?'mailBusiness.ocrFailed':'mailBusiness.saved'));}catch{toast.error(t('mailBusiness.error'));}finally{await qc.invalidateQueries({queryKey:key});setBusy(null);}};
 const attachments=(providerAttachments.data||mail.attachments||[]).map((a,i)=>({...a,key:attachmentKey(a,i)})).filter(a=>!suggestion||importableAttachment(a.name));
 if(providerAttachments.isLoading)return <Skeleton className="h-16 w-full"/>;
 if(providerAttachments.isError)return <div role="alert" className="text-sm text-destructive">{t('mailBusiness.error')}<Button variant="ghost" onClick={()=>void providerAttachments.refetch()}>{t('mailBusiness.retry')}</Button></div>;
 if(!attachments.length)return null;
 return <div className="space-y-2">{suggestion&&<p className="text-sm text-muted-foreground">{t('mailBusiness.suggestion')}</p>}{query.isError&&<p role="alert" className="text-sm text-destructive">{t('mailBusiness.error')}<Button variant="ghost" onClick={()=>void query.refetch()}>{t('mailBusiness.retry')}</Button></p>}{attachments.map(a=>{const linked=query.data?.find(r=>r.attachment_key===a.key&&r.status!=='failed');return <div key={a.key} className="flex flex-wrap items-center gap-2 border-b border-border py-2"><Paperclip className="h-4 w-4 text-muted-foreground"/><span className="text-sm break-all">{a.name}</span>{linked?.status==='ready'?<Button asChild variant="ghost" className="text-success min-h-11 gap-1"><Link to={`/administration/${linked.kind==='invoice'?'invoices':'receipts'}`}><Check className="h-4 w-4"/>{t(linked.kind==='invoice'?'mailBusiness.inInvoice':'mailBusiness.inReceipt')}</Link></Button>:importableAttachment(a.name)?<>{(['invoice','receipt'] as const).map(kind=><Button key={kind} variant="outline" className="min-h-11 gap-2" disabled={!!busy||!!linked||query.isLoading||query.isError} onClick={()=>void add(a.key,kind)}>{kind==='invoice'?<FileText className="h-4 w-4"/>:<Receipt className="h-4 w-4"/>}{t(`mailBusiness.${kind}`)}</Button>)}{(busy===a.key||linked?.status==='processing')&&<Skeleton className="h-4 w-24"/>}</>:null}</div>;})}</div>;
}

export function MailSourceLink({documentId}:{documentId:string}){
 const {user}=useAuth();const {t}=useTranslation();const q=useQuery({queryKey:['mail-document-source',user?.id,documentId],enabled:!!user,queryFn:async()=>{if(!user)return null;const {data,error}=await supabase.from('mail_document_imports').select('email_id').eq('user_id',user.id).eq('document_id',documentId).maybeSingle();if(error)throw error;return data;}});
 return q.data?.email_id?<Button asChild variant="ghost" className="min-h-11"><Link to={`/inbox?mail=${q.data.email_id}`}>{t('mailBusiness.source')}</Link></Button>:null;
}