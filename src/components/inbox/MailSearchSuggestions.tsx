import {useEffect,useState} from 'react';
import {useTranslation} from 'react-i18next';
import {useAuth} from '@/components/AuthProvider';
import {supabase} from '@/integrations/supabase/client';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogFooter} from '@/components/ui/dialog';
import {BookmarkPlus,X} from 'lucide-react';
import {useToast} from '@/hooks/use-toast';
import {parseMailSearch} from '@/lib/mail-search';
const operators=[['from:','from'],['to:','to'],['subject:','subject'],['has:attachment','attachment'],['is:unread','unread'],['is:starred','starred'],['label:','label'],['in:sent','folder'],['before:2026-10-01','before'],['after:2026-10-01','after']];
type Saved={id:string;name:string;query:string;view:string};
export function MailSearchSuggestions({query,view,onSelect,onClose}:{query:string;view:string;onSelect:(query:string,view?:string)=>void;onClose:()=>void}){
 const {user}=useAuth();const {t}=useTranslation();const {toast}=useToast();
 const [recent,setRecent]=useState<string[]>([]);const [saved,setSaved]=useState<Saved[]>([]);const [dialog,setDialog]=useState(false);const [name,setName]=useState('');const [busy,setBusy]=useState(false);
 const key=`servio-mail-search:${user?.id}`;
 useEffect(()=>{if(!user)return;let cancelled=false;try{const value=JSON.parse(localStorage.getItem(key)||'[]');setRecent(Array.isArray(value)?value.filter(v=>typeof v==='string').slice(0,8):[]);}catch{setRecent([]);}supabase.from('mail_saved_views').select('id,name,query,view').eq('user_id',user.id).order('created_at',{ascending:false}).then(({data})=>{if(!cancelled)setSaved(data||[]);});return()=>{cancelled=true;};},[user?.id,key]);
 useEffect(()=>{if(!user||!query.trim())return;const timer=setTimeout(()=>{try{parseMailSearch(query);const old=JSON.parse(localStorage.getItem(key)||'[]');const next=[query,...(Array.isArray(old)?old.filter(q=>typeof q==='string'&&q!==query):[])].slice(0,8);localStorage.setItem(key,JSON.stringify(next));setRecent(next);}catch{/* invalid query or restricted browser storage */}},1200);return()=>clearTimeout(timer);},[query,key,user?.id]);
 const save=async()=>{if(!user||!name.trim()||busy)return;setBusy(true);try{parseMailSearch(query);const {data,error}=await supabase.from('mail_saved_views').insert({user_id:user.id,name:name.trim().slice(0,80),query,view}).select('id,name,query,view').single();if(error)throw error;setSaved(prev=>[data,...prev]);setDialog(false);setName('');}catch{toast({title:t('mailSearch.saveError'),variant:'destructive'});}finally{setBusy(false);}};
 return <div className="absolute top-full left-0 mt-2 w-full min-w-0 max-h-[65vh] overflow-y-auto z-50 border border-border rounded-lg bg-popover text-popover-foreground shadow-lg p-2" onMouseDown={e=>e.preventDefault()}>
   {saved.length>0&&<><p className="text-xs text-muted-foreground px-2 py-1">{t('mailSearch.saved')}</p>{saved.map(item=><div key={item.id} className="flex items-center"><Button variant="ghost" className="min-h-11 flex-1 justify-start truncate" onClick={()=>{onSelect(item.query,item.view);onClose();}}>{item.name}</Button><Button variant="ghost" size="icon" className="h-11 w-11" aria-label={t('mailSearch.remove')} onClick={async()=>{const {error}=await supabase.from('mail_saved_views').delete().eq('id',item.id);if(error)toast({title:t('mailSearch.saveError'),variant:'destructive'});else setSaved(prev=>prev.filter(s=>s.id!==item.id));}}><X className="h-4 w-4"/></Button></div>)}</>}
   {recent.length>0&&<><p className="text-xs text-muted-foreground px-2 py-1">{t('mailSearch.recent')}</p>{recent.map(value=><Button key={value} variant="ghost" className="min-h-11 w-full justify-start text-left whitespace-normal break-all" onClick={()=>{onSelect(value);onClose();}}>{value}</Button>)}</>}
   <p className="text-xs text-muted-foreground px-2 py-1">{t('mailSearch.operators')}</p>
   {operators.map(([value,label])=><Button key={value} variant="ghost" className="min-h-11 w-full justify-between gap-2 text-xs" onClick={()=>onSelect(`${query.trim()} ${value}`.trim())}><code>{value}</code><span className="text-muted-foreground">{t(`mailSearch.${label}`)}</span></Button>)}
   {query.trim()&&<Button variant="outline" className="min-h-11 w-full whitespace-normal h-auto text-left" onClick={()=>setDialog(true)}><BookmarkPlus className="h-4 w-4 mr-2 shrink-0"/>{t('mailSearch.save')}</Button>}
   <Dialog open={dialog} onOpenChange={setDialog}><DialogContent onMouseDown={e=>e.stopPropagation()}><DialogHeader><DialogTitle>{t('mailSearch.save')}</DialogTitle></DialogHeader><Input aria-label={t('mailSearch.name')} placeholder={t('mailSearch.name')} maxLength={80} value={name} onChange={e=>setName(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')void save();}}/><DialogFooter><Button variant="ghost" onClick={()=>setDialog(false)}>{t('mailSearch.cancel')}</Button><Button disabled={!name.trim()||busy} onClick={()=>void save()}>{t('mailSearch.confirm')}</Button></DialogFooter></DialogContent></Dialog>
 </div>;
}