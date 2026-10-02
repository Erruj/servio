import { useState } from "react";
import { Info, Clock, CreditCard, X } from "lucide-react";
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

  const [dismissed, setDismissed] = useState(() => {
    try { return sessionStorage.getItem('servio-trial-expired-dismissed') === '1'; } catch { return false; }
  });
  const dismiss = () => {
    setDismissed(true);
    try { sessionStorage.setItem('servio-trial-expired-dismissed', '1'); } catch { /* noop */ }
  };

  if (hasActiveSubscription) return null;

  const daysLeft = getDaysUntilTrialExpires();
  const trialExpired = isTrialExpired();
  const locale = i18n.language?.startsWith('en') ? 'en-GB' : 'nl-NL';

  if (trialExpired) {
    if (dismissed) return null;
    return (
      <Alert className="border-primary/20 bg-primary/5 mb-4 py-3">
        <Info className="h-4 w-4 text-primary" />
        <AlertDescription className="flex flex-wrap items-center gap-2 sm:gap-3 pr-8">
          <span className="text-sm text-foreground flex-1 min-w-[12rem]">{t('trialExpiredBanner')}</span>
          <Button onClick={() => navigate('/pricing')} variant="outline" size="sm" className="min-h-11 sm:min-h-9">
            <CreditCard className="w-4 h-4 mr-2" />
            {t('upgradeNow')}
          </Button>
        </AlertDescription>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Sluiten"
          className="absolute right-1 top-1 h-11 w-11 inline-flex items-center justify-center rounded-[10px] text-muted-foreground hover:text-foreground transition-colors duration-200"
        >
          <X className="h-4 w-4" />
        </button>
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
