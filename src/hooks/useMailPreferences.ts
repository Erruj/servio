import {useQuery,useMutation,useQueryClient} from '@tanstack/react-query';
import {useAuth} from '@/components/AuthProvider';
import {supabase} from '@/integrations/supabase/client';
import type {MailNotificationMode} from '@/lib/mail-notifications';
export function useMailPreferences(){
 const {user}=useAuth();const qc=useQueryClient();const key=['mail-preferences',user?.id];
 const query=useQuery({queryKey:key,enabled:!!user,queryFn:async()=>{if(!user)return null;const {data,error}=await supabase.from('mail_preferences').select('*').eq('user_id',user.id).maybeSingle();if(error)throw error;return data;}});
 const update=useMutation({mutationFn:async(values:{default_connection_id?:string|null;notification_mode?:MailNotificationMode})=>{if(!user)throw new Error('session');const {error}=await supabase.from('mail_preferences').upsert({user_id:user.id,...values});if(error)throw error;},onSuccess:()=>qc.invalidateQueries({queryKey:key})});
 return {...query,update};
}
