// Thin re-export: all state lives in the SubscriptionProvider context so
// every consumer (Sidebar, MobileNav, MobileBottomNav, SubscriptionBanner,
// RateLimitBanner, UsageBadge, FeatureGate, SubscriptionGate, Dashboard,
// Pricing, useUsageTracking, ...) shares a single fetch per session.
export { useSubscriptionContext as useSubscription } from '@/components/SubscriptionProvider';
export { SUBSCRIPTION_TIERS, type SubscriptionStatus } from '@/hooks/subscriptionTiers';
