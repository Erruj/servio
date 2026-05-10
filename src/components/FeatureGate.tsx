import { useNavigate } from 'react-router-dom';
import { Lock, CreditCard, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useFeatureAccess, SubscriptionTier } from '@/hooks/useFeatureAccess';
import { HelpTooltip } from '@/components/HelpTooltip';

interface FeatureGateProps {
  children: React.ReactNode;
  feature: string;
  requiredTier?: SubscriptionTier;
  featureLabel?: string;
}

/**
 * Blocks access to features based on subscription tier.
 * Shows upgrade prompt when user doesn't have the required tier.
 */
export function FeatureGate({ children, feature, requiredTier = 'pro', featureLabel }: FeatureGateProps) {
  const { tier, isLoading, requiredTierLabel } = useFeatureAccess();
  const navigate = useNavigate();
  const { t } = useTranslation();

  if (isLoading) {
    return <>{children}</>;
  }

  const effectiveTier = tier === 'trial' ? 'pro' : (tier === 'none' ? 'starter' : tier);
  const tierOrder: SubscriptionTier[] = ['starter', 'pro', 'business'];
  const hasAccess = tierOrder.indexOf(effectiveTier) >= tierOrder.indexOf(requiredTier);

  if (hasAccess) {
    return <>{children}</>;
  }

  const label = featureLabel || feature;
  const requiredLabel = requiredTierLabel(feature);

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <Card className="max-w-md w-full shadow-elevated border-border">
        <CardContent className="pt-8 pb-8 text-center space-y-6">
          <div className="p-4 bg-muted rounded-full w-20 h-20 mx-auto flex items-center justify-center">
            <Lock className="h-10 w-10 text-muted-foreground" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2 flex items-center justify-center gap-2">
              {t('upgradeRequired')}
              <HelpTooltip
                tipKey={`feature-gate-${feature}`}
                title="Vergrendelde functie"
                text={`Deze functie is beschikbaar in het ${requiredLabel} plan. Upgrade om hem te ontgrendelen.`}
              />
            </h2>
            <p
              className="text-muted-foreground"
              dangerouslySetInnerHTML={{
                __html: t('featureRequiresUpgrade', { feature: label, tier: requiredLabel }),
              }}
            />
          </div>
          <Button onClick={() => navigate('/pricing')} size="lg" className="w-full">
            <CreditCard className="h-5 w-5 mr-2" />
            {t('viewPlans')}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
