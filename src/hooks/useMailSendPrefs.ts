import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
export function useMailSendPrefs() {
 const {user}=useAuth();const qc=useQueryClient();const key=['mail-send-prefs',user?.id];
 const query=useQuery({queryKey:key,enabled:!!user,queryFn:async()=>{if(!user)return 8;const {data,error}=await supabase.from('mail_send_preferences').select('undo_seconds').eq('user_id',user.id).maybeSingle();if(error)throw error;return data?.undo_seconds ?? 8;}});
 const update=useMutation({mutationFn:async(seconds:number)=>{if(!user)throw new Error('session');const {error}=await supabase.from('mail_send_preferences').upsert({user_id:user.id,undo_seconds:seconds});if(error)throw error;},onSuccess:()=>qc.invalidateQueries({queryKey:key})});
 return {seconds:query.data ?? 8,update};
}
