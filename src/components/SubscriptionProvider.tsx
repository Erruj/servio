import { createContext, useContext, ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/components/AuthProvider';
import { SUBSCRIPTION_TIERS, type SubscriptionStatus } from '@/hooks/subscriptionTiers';

const SUBSCRIPTION_QUERY_KEY = ['subscription-status'] as const;

async function fetchSubscription(): Promise<SubscriptionStatus | null> {
  const { data, error } = await supabase.functions.invoke('check-subscription');

  if (error) {
    const errorBody = await (error as any).context?.json?.() || {};
    if (errorBody?.error?.includes('does not exist') || errorBody?.error?.includes('User from sub claim')) {
      console.warn('User session invalid, signing out');
      await supabase.auth.signOut();
      return null;
    }
    throw error;
  }

  return data as SubscriptionStatus;
}

interface SubscriptionContextValue {
  subscriptionStatus: SubscriptionStatus | null;
  isLoading: boolean;
  checkSubscription: () => Promise<SubscriptionStatus | null>;
  createCheckoutSession: (tier: string, billingCycle?: 'monthly' | 'yearly') => Promise<void>;
  openCustomerPortal: () => Promise<void>;
  getCurrentTier: () => keyof typeof SUBSCRIPTION_TIERS | null;
  isTrialExpired: () => boolean;
  getDaysUntilTrialExpires: () => number;
  hasActiveSubscription: boolean;
  isOnTrial: boolean;
}

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

export const SubscriptionProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Single shared query — one fetch per session/window, gated on auth.
  const { data: subscriptionStatus = null, isLoading, refetch } = useQuery({
    queryKey: SUBSCRIPTION_QUERY_KEY,
    queryFn: fetchSubscription,
    enabled: !!user,
    staleTime: 60_000,
    refetchInterval: user ? 60_000 : false,
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
        body: { tier, billing_cycle: billingCycle },
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
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
      if (data?.url) window.open(data.url, '_blank');
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast.error('Kon abonnementsbeheer niet openen');
    }
  };

  const getCurrentTier = () => {
    const fromServer = subscriptionStatus?.tier;
    if (fromServer && fromServer in SUBSCRIPTION_TIERS) {
      return fromServer as keyof typeof SUBSCRIPTION_TIERS;
    }
    if (!subscriptionStatus?.product_id) return null;
    return (
      (Object.entries(SUBSCRIPTION_TIERS).find(
        ([, tier]) => tier.product_id === subscriptionStatus.product_id,
      )?.[0] as keyof typeof SUBSCRIPTION_TIERS | undefined) ?? null
    );
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

  const value: SubscriptionContextValue = {
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

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
};

export const useSubscriptionContext = (): SubscriptionContextValue => {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) {
    throw new Error('useSubscriptionContext must be used within a SubscriptionProvider');
  }
  return ctx;
};
