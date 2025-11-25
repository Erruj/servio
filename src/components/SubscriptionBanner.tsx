import { AlertCircle, Clock, CreditCard } from "lucide-react";
import { Alert, AlertDescription } from "./ui/alert";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";
import { useSubscription } from "@/hooks/useSubscription";

export const SubscriptionBanner = () => {
  const navigate = useNavigate();
  const { subscriptionStatus, isTrialExpired, getDaysUntilTrialExpires, hasActiveSubscription } = useSubscription();

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
            Je gratis trial is verlopen. Upgrade om toegang te behouden tot alle functies.
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

  if (daysLeft <= 3) {
    return (
      <Alert className="border-warning bg-warning/10 mb-4">
        <Clock className="h-4 w-4 text-warning" />
        <AlertDescription className="flex items-center justify-between">
          <span className="text-warning font-medium">
            Je hebt nog {daysLeft} {daysLeft === 1 ? 'dag' : 'dagen'} trial over. Upgrade om zonder onderbreking door te gaan!
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

  return null;
};
