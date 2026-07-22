import { useNavigate } from 'react-router-dom';
import { CreditCard, Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';

interface SubscriptionGateProps {
  children: React.ReactNode;
  feature?: string;
  requiredTier?: 'pro' | 'business';
}

export function SubscriptionGate({ children, feature, requiredTier = 'pro' }: SubscriptionGateProps) {
  const { tier, isLoading } = useFeatureAccess();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // While loading, render a neutral placeholder — never the gated children —
  // otherwise the paid page flashes before the paywall appears.
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="h-8 w-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
      </div>
    );
  }

  const effectiveTier = tier === 'trial' ? 'pro' : (tier === 'none' ? 'starter' : tier);
  const tierOrder = ['starter', 'pro', 'business'];
  const hasAccess = tierOrder.indexOf(effectiveTier) >= tierOrder.indexOf(requiredTier);

  if (hasAccess) return <>{children}</>;

  const label = requiredTier === 'business' ? 'Business' : 'Pro';
  const featureText = feature || t('thisFeature');

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <Card className="max-w-md w-full shadow-elevated">
        <CardContent className="pt-8 pb-8 text-center space-y-6">
          <div className="p-4 bg-destructive/10 rounded-full w-20 h-20 mx-auto flex items-center justify-center">
            <Lock className="h-10 w-10 text-destructive" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">{t('upgradeRequired')}</h2>
            <p
              className="text-muted-foreground"
              dangerouslySetInnerHTML={{
                __html: t('featureRequiresUpgrade', { feature: featureText, tier: label }),
              }}
            />
          </div>
          <Button onClick={() => navigate('/pricing')} size="lg" className="w-full">
            <CreditCard className="h-5 w-5 mr-2" />
            {t('viewPlans')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
