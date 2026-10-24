import {useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
import {useAuth} from '@/components/AuthProvider';
import {supabase} from '@/integrations/supabase/client';
import {useMailPreferences} from './useMailPreferences';
import {shouldNotify,type MailNotificationMode} from '@/lib/mail-notifications';
export function useMailNotifications(){
 const {user}=useAuth();const prefs=useMailPreferences();const navigate=useNavigate();const {t}=useTranslation();
 useEffect(()=>{if(!user||!('Notification' in window)||prefs.data?.notification_mode==='off'||!prefs.data)return;
 const owner=user.id;const mode=prefs.data.notification_mode as MailNotificationMode;const start=new Date().toISOString();const seen=new Set<string>();let stopped=false,busy=false;
 const poll=async()=>{if(stopped||busy||Notification.permission!=='granted')return;busy=true;
 try{const {data,error}=await supabase.from('emails').select('id,subject,from_name,from_email,ai_urgency').eq('user_id',owner).eq('folder','inbox').eq('is_read',false).gte('created_at',start).order('created_at',{ascending:false}).limit(100);
 if(error||stopped)return;
 for(const mail of data||[]){if(!shouldNotify(mode,mail.ai_urgency)||seen.has(mail.id))continue;seen.add(mail.id);const key=`servio-notified:${owner}:${mail.id}`;try{if(localStorage.getItem(key))continue;localStorage.setItem(key,String(Date.now()));}catch{}
 const notification=new Notification(t('mailPrefs.newMail'),{body:`${mail.from_name||mail.from_email}: ${mail.subject||t('mailPrefs.newMail')}`,tag:mail.id});notification.onclick=()=>{window.focus();navigate(`/inbox?mail=${encodeURIComponent(mail.id)}`);notification.close();};}
 }finally{busy=false;}};void poll();const timer=setInterval(()=>void poll(),15000);return()=>{stopped=true;clearInterval(timer);};
 },[user?.id,prefs.data?.notification_mode,navigate,t]);
}
