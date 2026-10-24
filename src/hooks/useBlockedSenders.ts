import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { legacyBlockedSenders, senderAddress } from '@/lib/mail-senders';
import { useState } from 'react';
export function useBlockedSenders() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const key = ['blocked-senders', user?.id];
  const [legacy, setLegacy] = useState(() => legacyBlockedSenders(localStorage.getItem('servio_blocked_senders')));
  const query = useQuery({queryKey:key, enabled:!!user, queryFn:async () => {
    if (!user) return [];
    const {data,error} = await supabase.from('blocked_senders').select('sender_email').eq('user_id',user.id).order('sender_email');
    if (error) throw error;
    return data.map(row=>row.sender_email);
  }});
  const block = useMutation({mutationFn:async (value:string) => {
    if (!user) throw new Error('session');
    const sender = senderAddress(value);
    if (!sender) throw new Error('invalid');
    const {error} = await supabase.from('blocked_senders').upsert({user_id:user.id,sender_email:sender},{onConflict:'user_id,sender_email',ignoreDuplicates:true});
    if (error) throw error;
  },onSuccess:()=>qc.invalidateQueries({queryKey:key})});
  const unblock = useMutation({mutationFn:async (sender:string) => {
    if (!user) throw new Error('session');
    const {error} = await supabase.from('blocked_senders').delete().eq('user_id',user.id).eq('sender_email',sender);
    if (error) throw error;
  },onSuccess:()=>qc.invalidateQueries({queryKey:key})});
  const dismissLegacy = () => {localStorage.removeItem('servio_blocked_senders');setLegacy([]);};
  const importLegacy = useMutation({mutationFn:async () => {
    if (!user) throw new Error('session');
    // Old records also contained display names. Resolve those only against this owner's mail.
    let values: unknown; try {values=JSON.parse(localStorage.getItem('servio_blocked_senders') || '[]');} catch {values=[];}
    const names=Array.isArray(values)?values.filter((v):v is string=>typeof v==='string'&&!senderAddress(v)):[];
    const resolved:string[]=[];
    for(let i=0;i<names.length;i+=50) {
      const {data,error}=await supabase.from('emails').select('from_email').eq('user_id',user.id).in('from_name',names.slice(i,i+50));
      if(error) throw error;
      resolved.push(...(data||[]).map(r=>senderAddress(r.from_email)).filter((v):v is string=>!!v));
    }
    const addresses=[...new Set([...legacy,...resolved])];
    if(addresses.length) {
      const {error}=await supabase.from('blocked_senders').upsert(addresses.map(sender_email=>({user_id:user.id,sender_email})),{onConflict:'user_id,sender_email',ignoreDuplicates:true});
      if(error) throw error;
    }
    dismissLegacy();
  },onSuccess:()=>qc.invalidateQueries({queryKey:key})});
  let hasLegacy=false;try {hasLegacy=!!localStorage.getItem('servio_blocked_senders') && localStorage.getItem('servio_blocked_senders')!=='[]';} catch { /* restricted storage */ }
  return {senders:query.data||[],loading:query.isLoading,error:query.error,block,unblock,legacy,hasLegacy,importLegacy,dismissLegacy};
}