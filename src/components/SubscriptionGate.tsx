import { useNavigate } from 'react-router-dom';
import { CreditCard, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';

interface SubscriptionGateProps {
  children: React.ReactNode;
  feature?: string;
  requiredTier?: 'pro' | 'business';
}

/**
 * Blocks access to paid features based on subscription tier.
 * Trial users get Pro-level access.
 */
export function SubscriptionGate({ children, feature = 'deze functie', requiredTier = 'pro' }: SubscriptionGateProps) {
  const { tier, isLoading, requiredTierLabel } = useFeatureAccess();
  const navigate = useNavigate();

  if (isLoading) return <>{children}</>;

  // Determine effective tier
  const effectiveTier = tier === 'trial' ? 'pro' : (tier === 'none' ? 'starter' : tier);
  const tierOrder = ['starter', 'pro', 'business'];
  const hasAccess = tierOrder.indexOf(effectiveTier) >= tierOrder.indexOf(requiredTier);

  if (hasAccess) return <>{children}</>;

  // Blocked
  const label = requiredTier === 'business' ? 'Business' : 'Pro';

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <Card className="max-w-md w-full shadow-elevated">
        <CardContent className="pt-8 pb-8 text-center space-y-6">
          <div className="p-4 bg-destructive/10 rounded-full w-20 h-20 mx-auto flex items-center justify-center">
            <Lock className="h-10 w-10 text-destructive" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Upgrade vereist</h2>
            <p className="text-muted-foreground">
              <strong>{feature}</strong> is beschikbaar vanaf het <strong>{label}</strong> plan. Upgrade je abonnement om toegang te krijgen.
            </p>
          </div>
          <Button
            onClick={() => navigate('/pricing')}
            size="lg"
            className="w-full"
          >
            <CreditCard className="h-5 w-5 mr-2" />
            Bekijk Abonnementen
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
