import { useSubscription } from '@/hooks/useSubscription';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface SubscriptionGateProps {
  children: React.ReactNode;
  feature?: string;
}

/**
 * Blocks access to paid features when trial has expired and no active subscription.
 * Wraps protected content and shows an upgrade prompt instead.
 */
export function SubscriptionGate({ children, feature = 'deze functie' }: SubscriptionGateProps) {
  const { hasActiveSubscription, isOnTrial, isTrialExpired, isLoading } = useSubscription();
  const navigate = useNavigate();

  // Allow access if loading, has active subscription, or is on trial
  if (isLoading || hasActiveSubscription || isOnTrial) {
    return <>{children}</>;
  }

  // Trial expired and no subscription → block
  if (isTrialExpired()) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <Card className="max-w-md w-full shadow-elevated">
          <CardContent className="pt-8 pb-8 text-center space-y-6">
            <div className="p-4 bg-destructive/10 rounded-full w-20 h-20 mx-auto flex items-center justify-center">
              <Lock className="h-10 w-10 text-destructive" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Trial verlopen</h2>
              <p className="text-muted-foreground">
                Je gratis proefperiode is verlopen. Upgrade je abonnement om toegang te krijgen tot {feature}.
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

  // Fallback: allow access (e.g. no trial info yet)
  return <>{children}</>;
}
