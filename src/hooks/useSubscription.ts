import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SubscriptionStatus {
  subscribed: boolean;
  product_id: string | null;
  subscription_status: 'trial' | 'active' | 'expired' | 'canceled';
  trial_end_date: string | null;
  subscription_end: string | null;
}

// Product mapping for subscription tiers
export const SUBSCRIPTION_TIERS = {
  starter: {
    product_id: 'prod_TUHktvw98PDTTn',
    price_id: 'price_1SXJAnDLXfTDUSDcxbedSrxR',
    name: 'Starter',
    price: 9.99,
    features: [
      'Beperkte inbox (50 e-mails/maand)',
      'Basis AI reply suggesties',
      '1 gebruiker',
      'Email support'
    ]
  },
  pro: {
    product_id: 'prod_U9FG9hWuBCWWMc',
    price_id: 'price_1SXJBPDLXfTDUSDcbIUY8onh',
    name: 'Pro',
    price: 29.99,
    features: [
      'Volledige inbox (onbeperkt)',
      'Administratie module',
      'AI boekhoudassistent',
      '3 gebruikers',
      'Priority support'
    ]
  },
  business: {
    product_id: 'prod_TUHl8Gz4fh6OIL',
    price_id: 'price_1SXJBcDLXfTDUSDcYeAzc1Rx',
    name: 'Business',
    price: 79.99,
    features: [
      'Alles van Pro',
      'Onbeperkte gebruikers',
      'Alle automatiseringen',
      'Prioriteits-SLA',
      'Dedicated support',
      'Custom integraties'
    ]
  }
} as const;

const SUBSCRIPTION_QUERY_KEY = ['subscription-status'] as const;

async function fetchSubscription(): Promise<SubscriptionStatus | null> {
  const { data, error } = await supabase.functions.invoke('check-subscription');

  if (error) {
    const errorBody = await error.context?.json?.() || {};
    if (errorBody?.error?.includes('does not exist') || errorBody?.error?.includes('User from sub claim')) {
      console.warn('User session invalid, signing out');
      await supabase.auth.signOut();
      return null;
    }
    throw error;
  }

  return data as SubscriptionStatus;
}

export const useSubscription = () => {
  const queryClient = useQueryClient();

  // Shared, deduplicated query: all 13+ consumers hit the same cache entry.
  // React Query guarantees only one in-flight request per key, and caches
  // the result across the whole tree.
  const { data: subscriptionStatus = null, isLoading, refetch } = useQuery({
    queryKey: SUBSCRIPTION_QUERY_KEY,
    queryFn: fetchSubscription,
    staleTime: 60_000,          // fresh for 60s → no refetch on mount within that window
    refetchInterval: 60_000,    // background refresh every 60s (once, not per-consumer)
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const checkSubscription = async () => {
    const result = await refetch();
    return result.data ?? null;
  };

  const createCheckoutSession = async (tier: string, billingCycle: 'monthly' | 'yearly' = 'monthly') => {
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { tier, billing_cycle: billingCycle }
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
        // Refresh subscription status after a delay
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: SUBSCRIPTION_QUERY_KEY });
        }, 2000);
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast.error('Kon checkout sessie niet starten');
    }
  };

  const openCustomerPortal = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast.error('Kon abonnementsbeheer niet openen');
    }
  };

  const getCurrentTier = () => {
    if (!subscriptionStatus?.product_id) return null;

    return Object.entries(SUBSCRIPTION_TIERS).find(
      ([_, tier]) => tier.product_id === subscriptionStatus.product_id
    )?.[0] as keyof typeof SUBSCRIPTION_TIERS | null;
  };

  const isTrialExpired = () => {
    if (!subscriptionStatus?.trial_end_date) return false;
    return new Date() > new Date(subscriptionStatus.trial_end_date);
  };

  const getDaysUntilTrialExpires = () => {
    if (!subscriptionStatus?.trial_end_date) return 0;
    const diff = new Date(subscriptionStatus.trial_end_date).getTime() - new Date().getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  return {
    subscriptionStatus,
    isLoading,
    checkSubscription,
    createCheckoutSession,
    openCustomerPortal,
    getCurrentTier,
    isTrialExpired,
    getDaysUntilTrialExpires,
    hasActiveSubscription: subscriptionStatus?.subscribed || false,
    isOnTrial: subscriptionStatus?.subscription_status === 'trial' && !isTrialExpired(),
  };
};
