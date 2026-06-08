import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Heart, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

type Row = { customer_sentiment: string | null; received_at: string };

const COLORS = {
  positive: '#34c759',
  neutral: '#a1a1aa',
  negative: '#ff6961',
};

const PERIODS = {
  '4w': { label: 'Afgelopen 4 weken', days: 28 },
  '3m': { label: 'Afgelopen 3 maanden', days: 90 },
  '6m': { label: 'Afgelopen 6 maanden', days: 180 },
} as const;

type PeriodKey = keyof typeof PERIODS;

function startOfWeek(d: Date): Date {
  const date = new Date(d);
  const day = (date.getDay() + 6) % 7; // monday = 0
  date.setDate(date.getDate() - day);
  date.setHours(0, 0, 0, 0);
  return date;
}

export const SentimentTrendChart = () => {
  const { user } = useAuth();
  const [period, setPeriod] = useState<PeriodKey>('4w');
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      const days = PERIODS[period].days;
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      const { data } = await supabase
        .from('emails')
        .select('customer_sentiment, received_at')
        .eq('user_id', user.id)
        .not('customer_sentiment', 'is', null)
        .gte('received_at', since)
        .order('received_at', { ascending: true })
        .limit(5000);
      setRows((data as Row[] | null) || []);
      setLoading(false);
    };
    load();
  }, [user, period]);

  const { chartData, thisWeek } = useMemo(() => {
    const buckets = new Map<string, { positive: number; neutral: number; negative: number; total: number }>();
    rows.forEach(r => {
      const s = (r.customer_sentiment || '').toLowerCase();
      if (!['positive', 'neutral', 'negative'].includes(s)) return;
      const wk = startOfWeek(new Date(r.received_at));
      const key = wk.toISOString().split('T')[0];
      const b = buckets.get(key) || { positive: 0, neutral: 0, negative: 0, total: 0 };
      (b as any)[s] += 1;
      b.total += 1;
      buckets.set(key, b);
    });
    const chart = Array.from(buckets.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, b]) => ({
        week: new Date(key).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' }),
        positive: b.total > 0 ? Math.round((b.positive / b.total) * 100) : 0,
        neutral: b.total > 0 ? Math.round((b.neutral / b.total) * 100) : 0,
        negative: b.total > 0 ? Math.round((b.negative / b.total) * 100) : 0,
      }));
    const thisWeek = chart[chart.length - 1] || null;
    return { chartData: chart, thisWeek };
  }, [rows]);

  const empty = !loading && chartData.length === 0;

  return (
    <Card className="shadow-card">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Heart className="h-5 w-5 text-primary" />
            Klanttevredenheid
          </CardTitle>
          <Select value={period} onValueChange={(v) => setPeriod(v as PeriodKey)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PERIODS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {thisWeek && (
          <p className="text-sm text-muted-foreground mt-2">
            Deze week: <span className="font-medium text-success">{thisWeek.positive}% positief</span>,{' '}
            <span className="font-medium text-muted-foreground">{thisWeek.neutral}% neutraal</span>,{' '}
            <span className="font-medium text-destructive">{thisWeek.negative}% negatief</span>
          </p>
        )}
        {thisWeek && thisWeek.negative > 30 && (
          <div className="flex items-center gap-2 mt-2 text-sm text-orange-600 dark:text-orange-400">
            <AlertTriangle className="h-4 w-4" />
            Let op: meer negatieve emails dan normaal
          </div>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : empty ? (
          <p className="text-sm text-muted-foreground text-center py-12">
            Nog niet genoeg data voor een overzicht. Koppel je mailbox en beantwoord emails om hier inzicht te krijgen.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="week" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis unit="%" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} axisLine={false} tickLine={false} domain={[0, 100]} />
              <Tooltip
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.06)' }}
                formatter={(v: number) => `${v}%`}
              />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="positive" stroke={COLORS.positive} strokeWidth={2.5} name="Positief" dot={false} activeDot={{ r: 5 }} />
              <Line type="monotone" dataKey="neutral" stroke={COLORS.neutral} strokeWidth={2.5} name="Neutraal" dot={false} activeDot={{ r: 5 }} />
              <Line type="monotone" dataKey="negative" stroke={COLORS.negative} strokeWidth={2.5} name="Negatief" dot={false} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};
