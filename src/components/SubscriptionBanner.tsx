import { AlertCircle, Clock, CreditCard } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Alert, AlertDescription } from "./ui/alert";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";
import { useSubscription } from "@/hooks/useSubscription";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";

export const SubscriptionBanner = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { subscriptionStatus, isTrialExpired, getDaysUntilTrialExpires, hasActiveSubscription } = useSubscription();
  const { tier } = useFeatureAccess();

  if (hasActiveSubscription) return null;

  const daysLeft = getDaysUntilTrialExpires();
  const trialExpired = isTrialExpired();
  const locale = i18n.language?.startsWith('en') ? 'en-GB' : 'nl-NL';

  if (trialExpired) {
    return (
      <Alert className="border-destructive bg-destructive/10 mb-4">
        <AlertCircle className="h-4 w-4 text-destructive" />
        <AlertDescription className="flex items-center justify-between">
          <span className="text-destructive font-medium">{t('trialExpiredBanner')}</span>
          <Button onClick={() => navigate('/pricing')} variant="destructive" size="sm">
            <CreditCard className="w-4 h-4 mr-2" />
            {t('upgradeNow')}
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (tier === 'trial') {
    const trialEndDate = subscriptionStatus?.trial_end_date
      ? new Date(subscriptionStatus.trial_end_date).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })
      : null;

    if (daysLeft <= 7) {
      return (
        <Alert className="border-warning bg-warning/10 mb-4">
          <Clock className="h-4 w-4 text-warning" />
          <AlertDescription className="flex items-center justify-between">
            <span className="text-warning font-medium">
              {t('trialEndingBanner', {
                date: trialEndDate,
                days: daysLeft,
                dayLabel: daysLeft === 1 ? t('day') : t('days'),
              })}
            </span>
            <Button onClick={() => navigate('/pricing')} variant="outline" size="sm">
              <CreditCard className="w-4 h-4 mr-2" />
              {t('viewPackages')}
            </Button>
          </AlertDescription>
        </Alert>
      );
    }
  }

  return null;
};
