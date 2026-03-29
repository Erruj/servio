import { useUsageTracking } from '@/hooks/useUsageTracking';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Mail, Sparkles, AlertTriangle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export function UsageBadge() {
  const { usage, isLoading } = useUsageTracking();
  const { limits, tier } = useFeatureAccess();

  // Don't show for unlimited plans
  if (tier === 'pro' || tier === 'business' || tier === 'trial') return null;
  if (isLoading) return null;

  const emailPercent = usage.emailLimit ? Math.min(100, (usage.emailCount / usage.emailLimit) * 100) : 0;
  const aiPercent = usage.aiCallLimit ? Math.min(100, (usage.aiCallCount / usage.aiCallLimit) * 100) : 0;

  return (
    <div className="px-4 py-3 space-y-3 border-t border-border">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Gebruik</p>

      <Tooltip>
        <TooltipTrigger asChild>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1 text-muted-foreground">
                <Mail className="h-3 w-3" /> E-mails
              </span>
              <span className={usage.isEmailLimitReached ? 'text-destructive font-medium' : 'text-muted-foreground'}>
                {usage.emailCount}/{usage.emailLimit}
              </span>
            </div>
            <Progress value={emailPercent} className="h-1.5" />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          {usage.isEmailLimitReached
            ? 'E-mail limiet bereikt. Upgrade voor onbeperkte emails.'
            : `${usage.emailCount} van ${usage.emailLimit} emails deze maand`}
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1 text-muted-foreground">
                <Sparkles className="h-3 w-3" /> AI-calls
              </span>
              <span className={usage.isAiLimitReached ? 'text-destructive font-medium' : 'text-muted-foreground'}>
                {usage.aiCallCount}/{usage.aiCallLimit}
              </span>
            </div>
            <Progress value={aiPercent} className="h-1.5" />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          {usage.isAiLimitReached
            ? 'AI-call limiet bereikt. Upgrade voor onbeperkte AI.'
            : `${usage.aiCallCount} van ${usage.aiCallLimit} AI-calls deze maand`}
        </TooltipContent>
      </Tooltip>

      {(usage.isEmailLimitReached || usage.isAiLimitReached) && (
        <div className="flex items-center gap-1 text-xs text-destructive">
          <AlertTriangle className="h-3 w-3" />
          <span>Limiet bereikt</span>
        </div>
      )}
    </div>
  );
}
