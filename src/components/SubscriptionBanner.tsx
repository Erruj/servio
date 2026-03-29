import { AlertCircle, Clock, CreditCard } from "lucide-react";
import { Alert, AlertDescription } from "./ui/alert";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";
import { useSubscription } from "@/hooks/useSubscription";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";

export const SubscriptionBanner = () => {
  const navigate = useNavigate();
  const { subscriptionStatus, isTrialExpired, getDaysUntilTrialExpires, hasActiveSubscription } = useSubscription();
  const { tier } = useFeatureAccess();

  // Don't show banner if user has active subscription
  if (hasActiveSubscription) return null;

  const daysLeft = getDaysUntilTrialExpires();
  const trialExpired = isTrialExpired();

  if (trialExpired) {
    return (
      <Alert className="border-destructive bg-destructive/10 mb-4">
        <AlertCircle className="h-4 w-4 text-destructive" />
        <AlertDescription className="flex items-center justify-between">
          <span className="text-destructive font-medium">
            Je gratis trial is verlopen. Je hebt nu alleen toegang tot Starter features. Upgrade om alle functies te gebruiken.
          </span>
          <Button 
            onClick={() => navigate('/pricing')}
            variant="destructive"
            size="sm"
          >
            <CreditCard className="w-4 h-4 mr-2" />
            Upgrade Nu
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (tier === 'trial') {
    const trialEndDate = subscriptionStatus?.trial_end_date
      ? new Date(subscriptionStatus.trial_end_date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })
      : null;

    if (daysLeft <= 7) {
      return (
        <Alert className="border-warning bg-warning/10 mb-4">
          <Clock className="h-4 w-4 text-warning" />
          <AlertDescription className="flex items-center justify-between">
            <span className="text-warning font-medium">
              Je gratis proefperiode loopt af op {trialEndDate} ({daysLeft} {daysLeft === 1 ? 'dag' : 'dagen'} resterend) — upgrade nu om toegang te behouden.
            </span>
            <Button 
              onClick={() => navigate('/pricing')}
              variant="outline"
              size="sm"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Bekijk Pakketten
            </Button>
          </AlertDescription>
        </Alert>
      );
    }
  }

  return null;
};
