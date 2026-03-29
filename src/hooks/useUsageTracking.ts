import { useState, useEffect, useCallback } from 'react';
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
  const [usage, setUsage] = useState<UsageData>({
    emailCount: 0,
    aiCallCount: 0,
    emailLimit: null,
    aiCallLimit: null,
    isEmailLimitReached: false,
    isAiLimitReached: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  const monthYear = getCurrentMonthYear();

  const fetchUsage = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('usage_tracking')
        .select('email_count, ai_call_count')
        .eq('user_id', user.id)
        .eq('month_year', monthYear)
        .maybeSingle();

      if (error) throw error;

      const emailCount = data?.email_count || 0;
      const aiCallCount = data?.ai_call_count || 0;

      setUsage({
        emailCount,
        aiCallCount,
        emailLimit: limits.emailsPerMonth,
        aiCallLimit: limits.aiCallsPerMonth,
        isEmailLimitReached: limits.emailsPerMonth !== null && emailCount >= limits.emailsPerMonth,
        isAiLimitReached: limits.aiCallsPerMonth !== null && aiCallCount >= limits.aiCallsPerMonth,
      });
    } catch (err) {
      console.error('Error fetching usage:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user, monthYear, limits]);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  const incrementEmail = useCallback(async () => {
    if (!user) return false;
    try {
      // Upsert: insert or increment
      const { data: existing } = await supabase
        .from('usage_tracking')
        .select('id, email_count')
        .eq('user_id', user.id)
        .eq('month_year', monthYear)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('usage_tracking')
          .update({ email_count: existing.email_count + 1, updated_at: new Date().toISOString() })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('usage_tracking')
          .insert({ user_id: user.id, month_year: monthYear, email_count: 1, ai_call_count: 0 });
      }

      await fetchUsage();
      return true;
    } catch (err) {
      console.error('Error incrementing email count:', err);
      return false;
    }
  }, [user, monthYear, fetchUsage]);

  const incrementAiCall = useCallback(async () => {
    if (!user) return false;
    try {
      const { data: existing } = await supabase
        .from('usage_tracking')
        .select('id, ai_call_count')
        .eq('user_id', user.id)
        .eq('month_year', monthYear)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('usage_tracking')
          .update({ ai_call_count: existing.ai_call_count + 1, updated_at: new Date().toISOString() })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('usage_tracking')
          .insert({ user_id: user.id, month_year: monthYear, email_count: 0, ai_call_count: 1 });
      }

      await fetchUsage();
      return true;
    } catch (err) {
      console.error('Error incrementing AI call count:', err);
      return false;
    }
  }, [user, monthYear, fetchUsage]);

  return {
    usage,
    isLoading,
    incrementEmail,
    incrementAiCall,
    refreshUsage: fetchUsage,
  };
}
