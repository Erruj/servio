import { useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/components/AuthProvider';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { Clock, TrendingUp, TrendingDown, PartyPopper } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const MIN_PER_EMAIL = 3;
const MIN_PER_INVOICE = 10;
const MIN_PER_AI_REPLY = 5;
const MILESTONES = [10, 25, 50, 100, 250, 500]; // hours

function formatHours(minutes: number): string {
  const hours = minutes / 60;
  if (hours < 1) return `${Math.round(minutes)} min`;
  return `${hours.toFixed(1).replace('.', ',')} uur`;
}

export function TimeSavedWidget() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: s, isLoading: loading } = useDashboardStats();
  const thisMonthMin = s ? s.read_emails_this_month * MIN_PER_EMAIL + s.invoices_this_month * MIN_PER_INVOICE + s.ai_this_month * MIN_PER_AI_REPLY : 0;
  const lastMonthMin = s ? s.read_emails_last_month * MIN_PER_EMAIL + s.invoices_last_month * MIN_PER_INVOICE + s.ai_last_month * MIN_PER_AI_REPLY : 0;

  useEffect(() => {
    if (!user || !s) return;
    try {
      const hours = thisMonthMin / 60;
      const seenKey = `servio_milestone_${user.id}`;
      const seen = JSON.parse(localStorage.getItem(seenKey) || '[]') as number[];
      const reached = MILESTONES.filter(m => hours >= m && !seen.includes(m));
      if (reached.length > 0) {
        const top = Math.max(...reached);
        toast({
          title: '🎉 Mijlpaal bereikt!',
          description: `Je hebt je eerste ${top} uur bespaard met Servio!`,
        });
        localStorage.setItem(seenKey, JSON.stringify([...seen, ...reached]));
      }
    } catch { /* ignore */ }
  }, [user, s, thisMonthMin, toast]);

  if (loading) return null;
  if (thisMonthMin === 0 && lastMonthMin === 0) return null;

  const diffMin = thisMonthMin - lastMonthMin;
  const TrendIcon = diffMin >= 0 ? TrendingUp : TrendingDown;
  const trendColor = diffMin >= 0 ? 'text-success' : 'text-destructive';

  return (
    <Card className="shadow-card border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
      <CardContent className="p-5 flex items-center gap-4">
        <div className="p-3 bg-primary/10 rounded-xl flex-shrink-0">
          <Clock className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
            Tijdsbesparing deze maand
          </div>
          <div className="text-2xl font-bold text-foreground flex items-center gap-2 flex-wrap">
            ⏱️ {formatHours(thisMonthMin)} bespaard
          </div>
          {lastMonthMin > 0 && (
            <div className={`text-xs mt-1 flex items-center gap-1 ${trendColor}`}>
              <TrendIcon className="h-3 w-3" />
              {diffMin >= 0 ? '↑' : '↓'} {formatHours(Math.abs(diffMin))} {diffMin >= 0 ? 'meer' : 'minder'} dan vorige maand
            </div>
          )}
        </div>
        {thisMonthMin / 60 >= 10 && (
          <div className="hidden sm:flex items-center gap-1 text-xs text-primary font-medium">
            <PartyPopper className="h-4 w-4" /> Top!
          </div>
        )}
      </CardContent>
    </Card>
  );
}
