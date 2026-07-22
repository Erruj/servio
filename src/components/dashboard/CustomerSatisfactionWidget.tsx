import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, Smile, Meh, Frown, Loader2 } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

type SentimentRow = { customer_sentiment: string | null };

const COLORS: Record<string, string> = {
  positive: 'hsl(var(--success))',
  neutral: 'hsl(var(--muted-foreground))',
  negative: 'hsl(var(--destructive))',
};

const LABELS: Record<string, string> = {
  positive: 'Positief',
  neutral: 'Neutraal',
  negative: 'Negatief',
};

export const CustomerSatisfactionWidget = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState<Record<string, number>>({ positive: 0, neutral: 0, negative: 0 });

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data } = await supabase
        .from('emails')
        .select('customer_sentiment')
        .eq('user_id', user.id)
        .not('customer_sentiment', 'is', null)
        .gte('received_at', since)
        .limit(1000);
      const tally: Record<string, number> = { positive: 0, neutral: 0, negative: 0 };
      (data as SentimentRow[] | null)?.forEach(r => {
        const s = (r.customer_sentiment || '').toLowerCase();
        if (s in tally) tally[s] += 1;
      });
      setCounts(tally);
      setLoading(false);
    };
    load();
  }, [user]);

  const total = counts.positive + counts.neutral + counts.negative;
  const data = Object.entries(counts)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => ({ name: LABELS[k], value: v, key: k }));

  const score = total > 0 ? Math.round(((counts.positive - counts.negative) / total) * 100) : 0;

  const hasData = total > 0;

  return (
    <Card className="shadow-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" /> Klanttevredenheid
          </span>
          {hasData && (
            <Badge variant={score >= 30 ? 'default' : score >= 0 ? 'secondary' : 'destructive'}>
              Score: {score > 0 ? '+' : ''}{score}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : !hasData ? (
          <div className="text-center py-8 space-y-3">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Heart className="h-6 w-6 text-primary" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">Nog geen sentiment data</p>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                Zodra de AI je inkomende emails analyseert zie je hier het sentiment van de laatste 30 dagen.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2}>
                  {data.map((d) => (
                    <Cell key={d.key} fill={COLORS[d.key]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Smile className="h-4 w-4 text-success" />
                <span className="flex-1 text-muted-foreground">Positief</span>
                <span className="font-semibold">{counts.positive}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Meh className="h-4 w-4 text-muted-foreground" />
                <span className="flex-1 text-muted-foreground">Neutraal</span>
                <span className="font-semibold">{counts.neutral}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Frown className="h-4 w-4 text-destructive" />
                <span className="flex-1 text-muted-foreground">Negatief</span>
                <span className="font-semibold">{counts.negative}</span>
              </div>
              <p className="text-xs text-muted-foreground pt-2">Op basis van {total} emails (laatste 30 dagen).</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
