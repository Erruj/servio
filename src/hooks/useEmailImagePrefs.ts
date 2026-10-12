import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';

export type EmailImageMode = 'ask' | 'always' | 'never';

// Tabellen staan nog niet in de gegenereerde types; daarom een losse client-cast.
const db = supabase as unknown as { from: (t: string) => any };

export function useEmailImagePrefs() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const key = ['email-image-prefs', user?.id];

  const query = useQuery({
    queryKey: key,
    enabled: !!user,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const [prefRes, sendersRes] = await Promise.all([
        db.from('email_image_preferences').select('mode').eq('user_id', user!.id).maybeSingle(),
        db.from('email_image_trusted_senders').select('sender_email').eq('user_id', user!.id),
      ]);
      const mode = (prefRes.data?.mode as EmailImageMode) || 'ask';
      const senders = new Set<string>((sendersRes.data || []).map((r: any) => String(r.sender_email).toLowerCase()));
      return { mode, senders };
    },
  });

  const setMode = useMutation({
    mutationFn: async (mode: EmailImageMode) => {
      const { error } = await db.from('email_image_preferences')
        .upsert({ user_id: user!.id, mode, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
      if (error) throw new Error('Je voorkeur voor afbeeldingen kon niet worden opgeslagen. Probeer het opnieuw.');
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  const trustSender = useMutation({
    mutationFn: async (sender: string) => {
      const { error } = await db.from('email_image_trusted_senders')
        .upsert({ user_id: user!.id, sender_email: sender.toLowerCase() }, { onConflict: 'user_id,sender_email' });
      if (error) throw new Error('Deze afzender kon niet worden opgeslagen. Probeer het opnieuw.');
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  return {
    mode: query.data?.mode ?? 'ask',
    senders: query.data?.senders ?? new Set<string>(),
    loaded: !user || query.isFetched,
    setMode,
    trustSender,
  };
}
