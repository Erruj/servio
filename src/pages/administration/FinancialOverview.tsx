import { useEffect, useState, useMemo, useRef } from 'react';
import { computeTotals, computeVat, expenseCategories, monthlySeries, formatEUR, formatPercent, formatAxisEUR } from '@/lib/finance';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, TrendingDown, DollarSign, Wallet, AlertTriangle, Lightbulb, Target, BarChart3, Inbox } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, BarChart, Bar } from 'recharts';
import { toast } from 'sonner';
import { AdminBreadcrumb } from '@/components/AdminBreadcrumb';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface MonthlyData {
  key: string;
  month: string;
  income: number;
  expenses: number;
  profit: number;
}

interface CategoryData {
  category: string;
  label: string;
  amount: number;
  percentage: number;
  vatAmount: number;
}

interface FinancialData {
  totalIncome: number;
  totalExpenses: number;
  profit: number;
  profitMargin: number | null;
  monthlyData: MonthlyData[];
  topCategories: CategoryData[];
  vatBalance: number;
  previousPeriodComparison: {
    incomeChange: number;
    expenseChange: number;
    profitChange: number;
  };
  insights: string[];
  benchmark: string | null;
}

type PeriodFilter = 'month' | 'quarter' | 'year' | 'all';

export default function FinancialOverview() {
  const { t } = useTranslation();
  const [data, setData] = useState<FinancialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEmpty, setIsEmpty] = useState(false);
  const [period, setPeriod] = useState<PeriodFilter | null>(null);
  const [aiInsights, setAiInsights] = useState<string[]>([]);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [insightsError, setInsightsError] = useState(false);

  // Bepaal eenmalig of er überhaupt data is, en kies de kleinste periode waarin de nieuwste data valt.
  useEffect(() => {
    (async () => {
      const latest = async (table: 'invoices' | 'receipts' | 'transactions', col: string) => {
        const { data } = await (supabase.from(table) as any).select(col).not(col, 'is', null).order(col, { ascending: false }).limit(1);
        return data?.[0]?.[col] as string | undefined;
      };
      const dates = (await Promise.all([
        latest('invoices', 'invoice_date'), latest('receipts', 'receipt_date'), latest('transactions', 'date'),
      ])).filter(Boolean) as string[];
      if (dates.length === 0) {
        setIsEmpty(true);
        setLoading(false);
        return;
      }
      const newest = new Date(dates.sort().reverse()[0]);
      const pick = (['month', 'quarter', 'year'] as PeriodFilter[]).find((p) => newest >= getDateRange(p).startDate) ?? 'all';
      setPeriod(pick);
    })();
  }, []);

  useEffect(() => {
    if (period) loadFinancialData();
  }, [period]);

  const getDateRange = (periodType: PeriodFilter) => {
    const now = new Date();
    let startDate: Date;
    let previousStartDate: Date;
    let previousEndDate: Date;

    switch (periodType) {
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        previousStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        previousEndDate = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case 'quarter':
        const currentQuarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), currentQuarter * 3, 1);
        previousStartDate = new Date(now.getFullYear(), (currentQuarter - 1) * 3, 1);
        previousEndDate = new Date(now.getFullYear(), currentQuarter * 3, 0);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        previousStartDate = new Date(now.getFullYear() - 1, 0, 1);
        previousEndDate = new Date(now.getFullYear() - 1, 11, 31);
        break;
      default:
        startDate = new Date(2000, 0, 1);
        previousStartDate = new Date(1999, 0, 1);
        previousEndDate = new Date(1999, 11, 31);
        break;
    }

    return { startDate, previousStartDate, previousEndDate, endDate: now };
  };

  const loadFinancialData = async () => {
    setLoading(true);
    try {
      const { startDate, previousStartDate, previousEndDate, endDate } = getDateRange(period ?? 'month');
      const now = new Date();
      const qStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
      const fetchFrom = [startDate, previousStartDate, qStart].reduce((a, b) => (a < b ? a : b));
      const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

      const [invoicesRes, receiptsRes, transactionsRes] = await Promise.all([
        supabase.from('invoices').select('*').gte('invoice_date', iso(fetchFrom)),
        supabase.from('receipts').select('*').gte('receipt_date', iso(fetchFrom)),
        supabase.from('transactions').select('*').gte('date', iso(fetchFrom)),
      ]);
      const allInv = (invoicesRes.data || []) as any[];
      const allRec = (receiptsRes.data || []) as any[];
      const allTx = (transactionsRes.data || []) as any[];
      const within = (d: string | null | undefined, a: Date, b: Date) => !!d && d >= iso(a) && d <= iso(b);
      const pick = (a: Date, b: Date) => ({
        inv: allInv.filter((i) => within(i.invoice_date, a, b)),
        rec: allRec.filter((r) => within(r.receipt_date, a, b)),
        tx: allTx.filter((x) => within(x.date, a, b)),
      });
      const cur = pick(startDate, endDate);
      const prev = pick(previousStartDate, previousEndDate);
      const q = pick(qStart, now);

      const totals = computeTotals(cur.inv, cur.rec, cur.tx);
      const prevTotals = computeTotals(prev.inv, prev.rec, prev.tx);
      const vat = computeVat(q.inv, q.rec);
      const pct = (a: number, b: number) => (b > 0 ? ((a - b) / b) * 100 : 0);

      const topCategories = expenseCategories(cur.inv, cur.rec, cur.tx).slice(0, 5);
      const chartStart = period === 'all'
        ? new Date([...cur.inv.map((i) => i.invoice_date), ...cur.rec.map((r) => r.receipt_date), ...cur.tx.map((x) => x.date)].filter(Boolean).sort()[0] ?? now)
        : startDate;
      const monthlyData = monthlySeries(chartStart, endDate, cur.inv, cur.rec, cur.tx);

      const insights: string[] = [];
      const expenseChange = pct(totals.expenses, prevTotals.expenses);
      if (expenseChange > 10) insights.push(`Kosten zijn ${formatPercent(expenseChange)} gestegen t.o.v. vorige periode`);
      if (totals.profitMargin !== null && totals.profitMargin < 20) insights.push(`Winstmarge van ${formatPercent(totals.profitMargin)} is onder het gezonde niveau (20%+)`);
      if (topCategories[0] && topCategories[0].percentage > 40) insights.push(`${topCategories[0].label} vormt ${formatPercent(topCategories[0].percentage, 'nl-NL', 0)} van je uitgaven`);
      if (totals.income === 0) insights.push('Nog geen inkomsten in deze periode: voeg een verkoopfactuur of inkomsttransactie toe.');

      const last3 = monthlyData.slice(-3);
      const threeMonthAvg = last3.reduce((s, m) => s + m.expenses, 0) / Math.max(1, last3.length);
      const currentExpenses = monthlyData[monthlyData.length - 1]?.expenses || 0;
      const benchmarkDiff = threeMonthAvg > 0 ? ((currentExpenses - threeMonthAvg) / threeMonthAvg) * 100 : 0;
      const benchmark = threeMonthAvg > 0
        ? `Je kosten deze maand liggen ${formatPercent(Math.abs(benchmarkDiff), 'nl-NL', 0)} ${benchmarkDiff > 0 ? 'boven' : 'onder'} je 3-maandsgemiddelde`
        : null;

      setIsEmpty(false);
      setData({
        totalIncome: totals.income,
        totalExpenses: totals.expenses,
        profit: totals.profit,
        profitMargin: totals.profitMargin,
        vatBalance: vat.balance,
        previousPeriodComparison: {
          incomeChange: pct(totals.income, prevTotals.income),
          expenseChange,
          profitChange: prevTotals.profit > 0 ? pct(totals.profit, prevTotals.profit) : 0,
        },
        monthlyData,
        topCategories,
        insights,
        benchmark,
      });
      loadAiInsights(totals.income, totals.expenses, totals.profitMargin, topCategories, vat.balance);
    } catch (error) {
      console.error('Error loading financial data:', error);
      toast.error('Financiële gegevens konden niet worden geladen. Probeer het opnieuw.');
    } finally {
      setLoading(false);
    }
  };

  const insightArgs = useRef<Parameters<typeof loadAiInsights> | null>(null);
  async function loadAiInsights(income: number, expenses: number, margin: number | null, categories: CategoryData[], vat: number) {
    insightArgs.current = [income, expenses, margin, categories, vat];
    setLoadingInsights(true);
    setInsightsError(false);
    setAiInsights([]);
    try {
      const call = supabase.functions.invoke('ai-assistant', {
        body: {
          query: `Geef 3 korte, concrete financiële inzichten (één per regel, zonder opsomtekens) op basis van: inkomsten ${formatEUR(income)}, uitgaven ${formatEUR(expenses)}, winstmarge ${margin === null ? 'onbekend (geen omzet)' : formatPercent(margin)}, btw-saldo dit kwartaal ${formatEUR(vat)} (negatief = terug te vragen). Uitgaven per categorie: ${categories.map(c => `${c.label}: ${formatEUR(c.amount)}`).join(', ') || 'geen'}.`,
          type: 'insights',
          conversationHistory: [],
        },
      });
      const timeout = new Promise<never>((_, rej) => setTimeout(() => rej(new Error('timeout')), 10000));
      const { data, error } = (await Promise.race([call, timeout])) as any;
      if (error || !data?.answer) throw error ?? new Error('leeg antwoord');
      setAiInsights(data.answer.split('\n').map((s: string) => s.replace(/^[-*•\d.\s]+/, '').trim()).filter(Boolean).slice(0, 3));
    } catch (error) {
      console.error('AI-inzichten laden mislukt:', error);
      setInsightsError(true);
    } finally {
      setLoadingInsights(false);
    }
  }

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-foreground mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {formatEUR(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const PieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-foreground">{data.label}</p>
          <p className="text-sm text-muted-foreground">{formatEUR(data.amount)}</p>
          <p className="text-sm text-muted-foreground">{formatPercent(data.percentage)}</p>
          {data.vatAmount > 0 && (
            <p className="text-xs text-muted-foreground">BTW: {formatEUR(data.vatAmount)}</p>
          )}
        </div>
      );
    }
    return null;
  };

  const formatChange = (value: number) => {
    const isPositive = value >= 0;
    return (
      <span className={`text-sm font-medium ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
        {isPositive ? '+' : ''}{formatPercent(value)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">{t('loading')}...</div>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="space-y-6 p-6">
        <AdminBreadcrumb currentPage="Financieel Overzicht" />
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t('financialOverview')}</h1>
          <p className="text-muted-foreground">{t('financialOverviewDescription')}</p>
        </div>
        <EmptyState
          icon={Inbox}
          title="Nog geen financiële data"
          description="Koppel je mailbox of upload je eerste factuur of bonnetje om je financieel overzicht te zien."
        />
        <div className="flex flex-wrap gap-3 justify-center">
          <Button asChild>
            <Link to="/mailbox-setup">Mailbox koppelen</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/administration/invoices">Factuur uploaden</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/administration/receipts">Bonnetje uploaden</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6 p-6">
      <AdminBreadcrumb currentPage="Financieel Overzicht" />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t('financialOverview')}</h1>
          <p className="text-muted-foreground">{t('financialOverviewDescription')}</p>
        </div>
        <Select value={period ?? 'month'} onValueChange={(v: PeriodFilter) => setPeriod(v)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="month">{t('thisMonth')}</SelectItem>
            <SelectItem value="quarter">{t('thisQuarter')}</SelectItem>
            <SelectItem value="year">{t('thisYear')}</SelectItem>
            <SelectItem value="all">{t('allTime', { defaultValue: 'Alles' })}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('totalIncome')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatEUR(data.totalIncome)}</div>
            <div className="flex items-center gap-2 mt-1">
              {formatChange(data.previousPeriodComparison.incomeChange)}
              <span className="text-xs text-muted-foreground">vs vorige periode</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('totalExpenses')}</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatEUR(data.totalExpenses)}</div>
            <div className="flex items-center gap-2 mt-1">
              {formatChange(-data.previousPeriodComparison.expenseChange)}
              <span className="text-xs text-muted-foreground">vs vorige periode</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('profit')}</CardTitle>
            <Wallet className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatEUR(data.profit)}</div>
            <div className="flex items-center gap-2 mt-1">
              {formatChange(data.previousPeriodComparison.profitChange)}
              <span className="text-xs text-muted-foreground">vs vorige periode</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Winstmarge</CardTitle>
            <Target className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{data.profitMargin === null ? '—' : formatPercent(data.profitMargin)}</div>
            <div className="flex items-center gap-2 mt-1">
              {data.profitMargin === null ? (
                <span className="text-xs text-muted-foreground">Geen omzet in deze periode</span>
              ) : (
                <Badge variant={data.profitMargin > 30 ? 'default' : data.profitMargin > 15 ? 'secondary' : 'destructive'}>
                  {data.profitMargin > 30 ? 'Uitstekend' : data.profitMargin > 15 ? 'Gezond' : 'Let op'}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights & Benchmark */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              AI Inzichten
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loadingInsights ? (
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </div>
            ) : insightsError ? (
              <div className="space-y-3">
                {data.insights.map((insight, i) => (<p key={i} className="text-sm text-foreground">{insight}</p>))}
                <p className="text-sm text-muted-foreground">De AI-inzichten konden niet worden geladen.</p>
                <Button size="sm" variant="outline" onClick={() => insightArgs.current && loadAiInsights(...insightArgs.current)}>Opnieuw proberen</Button>
              </div>
            ) : aiInsights.length > 0 ? (
              aiInsights.map((insight, i) => (
                <p key={i} className="text-sm text-foreground">{insight}</p>
              ))
            ) : (
              data.insights.map((insight, i) => (
                <p key={i} className="text-sm text-foreground">{insight}</p>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Benchmark & BTW
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.benchmark && (
              <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-foreground">{data.benchmark}</p>
              </div>
            )}
            <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
              <div>
                <p className="text-sm font-medium text-foreground">{data.vatBalance < 0 ? 'Naar verwachting terug te vragen' : 'Reserveer voor btw'}</p>
                <p className="text-xs text-muted-foreground">Dit kwartaal: af te dragen btw min voorbelasting</p>
              </div>
              <p className="text-xl font-bold text-primary">{formatEUR(Math.abs(data.vatBalance))}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('monthlyTrend')}</CardTitle>
            <CardDescription>{period === 'month' ? t('thisMonth') : period === 'quarter' ? t('thisQuarter') : period === 'year' ? t('thisYear') : t('allTime', { defaultValue: 'Alles' })}</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => formatAxisEUR(v)} width={72} />
                <RechartsTooltip content={<CustomTooltip />} />
                <Legend />
                <Line type="monotone" dataKey="income" stroke="hsl(var(--primary))" strokeWidth={2} name={t('income')} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="expenses" stroke="hsl(var(--destructive))" strokeWidth={2} name={t('expenses')} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="profit" stroke="hsl(var(--chart-3))" strokeWidth={2} name={t('profit')} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('topExpenseCategories')}</CardTitle>
            <CardDescription>Verdeling van uitgaven</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.topCategories}
                  dataKey="amount"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  innerRadius={50}
                  label={({ label, percentage }) => `${label}: ${formatPercent(percentage, 'nl-NL', 0)}`}
                  labelLine={false}
                >
                  {data.topCategories.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip content={<PieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Profit Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Maandelijkse Winst</CardTitle>
          <CardDescription>Netto resultaat per maand</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => formatAxisEUR(v)} width={72} />
              <RechartsTooltip content={<CustomTooltip />} />
              <Bar dataKey="profit" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name={t('profit')} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
