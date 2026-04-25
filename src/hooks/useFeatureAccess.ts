import { useMemo } from 'react';
import { useSubscription, SUBSCRIPTION_TIERS } from './useSubscription';

export type SubscriptionTier = 'starter' | 'pro' | 'business' | 'trial' | 'none';

export interface FeatureLimits {
  emailsPerMonth: number | null; // null = unlimited
  aiCallsPerMonth: number | null;
  maxUsers: number | null;
}

export interface FeatureAccess {
  tier: SubscriptionTier;
  tierLabel: string;
  isLoading: boolean;

  // Feature access
  canAccessAdministration: boolean;
  canAccessAIAssistant: boolean;
  canAccessDocuments: boolean;
  canAccessExports: boolean;
  canAccessAdvancedStats: boolean;
  canManageTeam: boolean;
  canInviteUsers: boolean;

  // Limits
  limits: FeatureLimits;

  // Helpers
  requiredTierFor: (feature: string) => SubscriptionTier;
  requiredTierLabel: (feature: string) => string;
}

const TIER_LABELS: Record<SubscriptionTier, string> = {
  starter: 'Starter',
  pro: 'Pro',
  business: 'Business',
  trial: 'Pro (Trial)',
  none: 'Geen',
};

// Legacy product IDs that should still map to a tier (backward compatibility)
const LEGACY_PRODUCT_TIER_MAP: Record<string, SubscriptionTier> = {
  prod_TUHktvw98PDTTn: 'starter',
  prod_TUHkdkFCR6tlSm: 'pro',
  prod_TUHl8Gz4fh6OIL: 'business',
};

// Map product IDs to tier names
function getTierFromProductId(productId: string | null | undefined): SubscriptionTier {
  if (!productId) return 'none';
  for (const [key, tier] of Object.entries(SUBSCRIPTION_TIERS)) {
    if (tier.product_id === productId) return key as SubscriptionTier;
  }
  if (LEGACY_PRODUCT_TIER_MAP[productId]) return LEGACY_PRODUCT_TIER_MAP[productId];
  return 'none';
}

const FEATURE_REQUIRED_TIER: Record<string, SubscriptionTier> = {
  administration: 'pro',
  ai_assistant: 'pro',
  documents: 'pro',
  exports: 'pro',
  advanced_stats: 'pro',
  team_management: 'pro',
  unlimited_users: 'business',
  api_access: 'business',
  automations: 'business',
};

export function useFeatureAccess(): FeatureAccess {
  const {
    subscriptionStatus,
    isLoading,
    hasActiveSubscription,
    isOnTrial,
    isTrialExpired,
  } = useSubscription();

  const tier = useMemo<SubscriptionTier>(() => {
    if (isLoading) return 'none';

    // Active trial → Pro features
    if (isOnTrial) return 'trial';

    // Active subscription → check product
    if (hasActiveSubscription && subscriptionStatus?.product_id) {
      return getTierFromProductId(subscriptionStatus.product_id);
    }

    // Trial expired, no sub → Starter (locked down)
    if (isTrialExpired()) return 'starter';

    // Fallback during loading/no data
    return 'none';
  }, [isLoading, isOnTrial, hasActiveSubscription, subscriptionStatus, isTrialExpired]);

  const effectiveTier = useMemo(() => {
    // trial gives Pro-level access
    if (tier === 'trial') return 'pro';
    if (tier === 'none') return 'starter'; // default to starter
    return tier;
  }, [tier]);

  const isAtLeast = (required: SubscriptionTier): boolean => {
    const order: SubscriptionTier[] = ['starter', 'pro', 'business'];
    return order.indexOf(effectiveTier) >= order.indexOf(required);
  };

  const limits = useMemo<FeatureLimits>(() => {
    switch (effectiveTier) {
      case 'starter':
        return { emailsPerMonth: 100, aiCallsPerMonth: 50, maxUsers: 1 };
      case 'pro':
        return { emailsPerMonth: null, aiCallsPerMonth: null, maxUsers: 3 };
      case 'business':
        return { emailsPerMonth: null, aiCallsPerMonth: null, maxUsers: null };
      default:
        return { emailsPerMonth: 100, aiCallsPerMonth: 50, maxUsers: 1 };
    }
  }, [effectiveTier]);

  const requiredTierFor = (feature: string): SubscriptionTier => {
    return FEATURE_REQUIRED_TIER[feature] || 'starter';
  };

  const requiredTierLabel = (feature: string): string => {
    return TIER_LABELS[requiredTierFor(feature)];
  };

  return {
    tier,
    tierLabel: TIER_LABELS[tier],
    isLoading,
    canAccessAdministration: isAtLeast('pro'),
    canAccessAIAssistant: isAtLeast('pro'),
    canAccessDocuments: isAtLeast('pro'),
    canAccessExports: isAtLeast('pro'),
    canAccessAdvancedStats: isAtLeast('pro'),
    canManageTeam: isAtLeast('pro'),
    canInviteUsers: isAtLeast('pro'),
    limits,
    requiredTierFor,
    requiredTierLabel,
  };
}
