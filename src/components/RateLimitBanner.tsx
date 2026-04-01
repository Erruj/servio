import { useUsageTracking } from '@/hooks/useUsageTracking';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export function RateLimitBanner() {
  const { usage, isLoading } = useUsageTracking();
  const { tier } = useFeatureAccess();
  const navigate = useNavigate();

  // Don't show for unlimited plans
  if (tier === 'pro' || tier === 'business' || tier === 'trial') return null;
  if (isLoading) return null;

  const emailWarning = usage.emailLimit && usage.emailCount >= usage.emailLimit * 0.8;
  const aiWarning = usage.aiCallLimit && usage.aiCallCount >= usage.aiCallLimit * 0.8;
  const emailReached = usage.isEmailLimitReached;
  const aiReached = usage.isAiLimitReached;

  if (!emailWarning && !aiWarning) return null;

  const isBlocked = emailReached || aiReached;

  return (
    <div className={`px-4 py-3 border-b flex items-center gap-3 ${isBlocked ? 'bg-destructive/10 border-destructive/30' : 'bg-warning/10 border-warning/30'}`}>
      <AlertTriangle className={`h-4 w-4 flex-shrink-0 ${isBlocked ? 'text-destructive' : 'text-warning'}`} />
      <div className="flex-1 text-sm">
        {emailReached && <span className="font-medium text-destructive">E-mail limiet bereikt ({usage.emailCount}/{usage.emailLimit}). </span>}
        {aiReached && <span className="font-medium text-destructive">AI-call limiet bereikt ({usage.aiCallCount}/{usage.aiCallLimit}). </span>}
        {!isBlocked && emailWarning && <span className="text-warning">E-mails: {usage.emailCount}/{usage.emailLimit}. </span>}
        {!isBlocked && aiWarning && <span className="text-warning">AI-calls: {usage.aiCallCount}/{usage.aiCallLimit}. </span>}
        <span className="text-muted-foreground">Upgrade voor onbeperkt gebruik.</span>
      </div>
      <Button size="sm" variant={isBlocked ? "destructive" : "outline"} onClick={() => navigate('/pricing')} className="flex-shrink-0">
        Upgrade <ArrowRight className="h-3 w-3 ml-1" />
      </Button>
    </div>
  );
}
