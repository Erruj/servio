import { useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { useFeatureAccess } from './useFeatureAccess';

function getCurrentMonthYear(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export interface UsageData {
  emailCount: number;
  aiCallCount: number;
  emailLimit: number | null;
  aiCallLimit: number | null;
  isEmailLimitReached: boolean;
  isAiLimitReached: boolean;
}

export function useUsageTracking() {
  const { user } = useAuth();
  const { limits } = useFeatureAccess();
  const queryClient = useQueryClient();
  const monthYear = getCurrentMonthYear();
  const queryKey = ['usage-tracking', user?.id, monthYear];

  // Gedeelde query: alle componenten op een pagina delen één request.
  const { data, isLoading: queryLoading } = useQuery({
    queryKey,
    enabled: !!user,
    staleTime: 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('usage_tracking')
        .select('email_count, ai_call_count')
        .eq('user_id', user!.id)
        .eq('month_year', monthYear)
        .maybeSingle();
      if (error) throw error;
      return { emailCount: data?.email_count || 0, aiCallCount: data?.ai_call_count || 0 };
    },
  });

  const emailCount = data?.emailCount ?? 0;
  const aiCallCount = data?.aiCallCount ?? 0;
  const usage: UsageData = useMemo(() => ({
    emailCount,
    aiCallCount,
    emailLimit: limits.emailsPerMonth,
    aiCallLimit: limits.aiCallsPerMonth,
    isEmailLimitReached: limits.emailsPerMonth !== null && emailCount >= limits.emailsPerMonth,
    isAiLimitReached: limits.aiCallsPerMonth !== null && aiCallCount >= limits.aiCallsPerMonth,
  }), [emailCount, aiCallCount, limits]);
  const isLoading = !!user && queryLoading;

  const fetchUsage = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['usage-tracking', user?.id] });
  }, [queryClient, user?.id]);

  // Tellers worden server-side opgehoogd door de edge functions (send-email,
  // generate-reply, ai-assistant, summarize-thread). Hier alleen verversen.
  const incrementEmail = useCallback(async () => { await fetchUsage(); return true; }, [fetchUsage]);
  const incrementAiCall = useCallback(async () => { await fetchUsage(); return true; }, [fetchUsage]);

  return {
    usage,
    isLoading,
    incrementEmail,
    incrementAiCall,
    refreshUsage: fetchUsage,
  };
}
