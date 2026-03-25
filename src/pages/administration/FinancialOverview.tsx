import { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, TrendingDown, DollarSign, Wallet, AlertTriangle, Lightbulb, Target, BarChart3 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, BarChart, Bar } from 'recharts';
import { toast } from 'sonner';

interface MonthlyData {
  month: string;
  monthNum: number;
  year: number;
  income: number;
  expenses: number;
  profit: number;
}

interface CategoryData {
  category: string;
  amount: number;
  percentage: number;
  vatAmount: number;
}

interface FinancialData {
  totalIncome: number;
  totalExpenses: number;
  profit: number;
  profitMargin: number;
  monthlyData: MonthlyData[];
  topCategories: CategoryData[];
  totalVat: number;
  previousPeriodComparison: {
    incomeChange: number;
    expenseChange: number;
    profitChange: number;
  };
  insights: string[];
  benchmark: string | null;
}

type PeriodFilter = 'month' | 'quarter' | 'year';

export default function FinancialOverview() {
  const { t } = useTranslation();
  const [data, setData] = useState<FinancialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodFilter>('month');
  const [aiInsights, setAiInsights] = useState<string[]>([]);
  const [loadingInsights, setLoadingInsights] = useState(false);

  useEffect(() => {
    loadFinancialData();
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
    }

    return { startDate, previousStartDate, previousEndDate, endDate: now };
  };

  const loadFinancialData = async () => {
    setLoading(true);
    try {
      const { startDate, previousStartDate, previousEndDate } = getDateRange(period);
      
      // Fetch all financial data
      const [invoicesRes, receiptsRes, transactionsRes] = await Promise.all([
        supabase.from('invoices').select('*').gte('invoice_date', startDate.toISOString().split('T')[0]),
        supabase.from('receipts').select('*').gte('receipt_date', startDate.toISOString().split('T')[0]),
        supabase.from('transactions').select('*')
      ]);

      // Previous period for comparison
      const [prevInvoicesRes, prevReceiptsRes] = await Promise.all([
        supabase.from('invoices').select('*')
          .gte('invoice_date', previousStartDate.toISOString().split('T')[0])
          .lte('invoice_date', previousEndDate.toISOString().split('T')[0]),
        supabase.from('receipts').select('*')
          .gte('receipt_date', previousStartDate.toISOString().split('T')[0])
          .lte('receipt_date', previousEndDate.toISOString().split('T')[0])
      ]);

      const invoices = invoicesRes.data || [];
      const receipts = receiptsRes.data || [];
      const transactions = transactionsRes.data || [];
      const prevInvoices = prevInvoicesRes.data || [];
      const prevReceipts = prevReceiptsRes.data || [];

      // Calculate current period
      const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + parseFloat(t.amount?.toString() || '0'), 0) +
        invoices.filter(i => i.status === 'paid')
        .reduce((sum, i) => sum + parseFloat(i.amount?.toString() || '0'), 0);

      const totalExpenses = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + parseFloat(t.amount?.toString() || '0'), 0) +
        receipts.reduce((sum, r) => sum + parseFloat(r.amount?.toString() || '0'), 0);

      const totalVat = invoices.reduce((sum, i) => sum + parseFloat(i.vat_amount?.toString() || '0'), 0);

      // Calculate previous period
      const prevIncome = prevInvoices.filter(i => i.status === 'paid')
        .reduce((sum, i) => sum + parseFloat(i.amount?.toString() || '0'), 0);
      const prevExpenses = prevReceipts.reduce((sum, r) => sum + parseFloat(r.amount?.toString() || '0'), 0);
      const prevProfit = prevIncome - prevExpenses;

      // Calculate percentage changes
      const incomeChange = prevIncome > 0 ? ((totalIncome - prevIncome) / prevIncome) * 100 : 0;
      const expenseChange = prevExpenses > 0 ? ((totalExpenses - prevExpenses) / prevExpenses) * 100 : 0;
      const profitChange = prevProfit > 0 ? (((totalIncome - totalExpenses) - prevProfit) / prevProfit) * 100 : 0;

      // Category breakdown
      const categoryMap: Record<string, { amount: number; vatAmount: number }> = {};
      
      [...receipts, ...transactions.filter(t => t.type === 'expense')].forEach(item => {
        const cat = item.category || 'other';
        if (!categoryMap[cat]) {
          categoryMap[cat] = { amount: 0, vatAmount: 0 };
        }
        categoryMap[cat].amount += parseFloat(item.amount?.toString() || '0');
      });

      invoices.forEach(inv => {
        const cat = inv.category || 'other';
        if (!categoryMap[cat]) {
          categoryMap[cat] = { amount: 0, vatAmount: 0 };
        }
        categoryMap[cat].vatAmount += parseFloat(inv.vat_amount?.toString() || '0');
      });

      const totalCategoryAmount = Object.values(categoryMap).reduce((sum, c) => sum + c.amount, 0);
      const topCategories: CategoryData[] = Object.entries(categoryMap)
        .map(([category, data]) => ({
          category,
          amount: data.amount,
          vatAmount: data.vatAmount,
          percentage: totalCategoryAmount > 0 ? (data.amount / totalCategoryAmount) * 100 : 0
        }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);

      // Monthly data for charts
      const monthlyMap: Record<string, MonthlyData> = {};
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        monthlyMap[key] = {
          month: monthNames[d.getMonth()],
          monthNum: d.getMonth(),
          year: d.getFullYear(),
          income: 0,
          expenses: 0,
          profit: 0
        };
      }

      transactions.forEach(t => {
        const date = new Date(t.date);
        const key = `${date.getFullYear()}-${date.getMonth()}`;
        if (monthlyMap[key]) {
          if (t.type === 'income') {
            monthlyMap[key].income += parseFloat(t.amount?.toString() || '0');
          } else {
            monthlyMap[key].expenses += parseFloat(t.amount?.toString() || '0');
          }
        }
      });

      Object.keys(monthlyMap).forEach(key => {
        monthlyMap[key].profit = monthlyMap[key].income - monthlyMap[key].expenses;
      });

      const monthlyData = Object.values(monthlyMap);
      const profit = totalIncome - totalExpenses;
      const profitMargin = totalIncome > 0 ? (profit / totalIncome) * 100 : 0;

      // Generate insights
      const insights: string[] = [];
      if (expenseChange > 10) {
        insights.push(`⚠️ Kosten zijn ${expenseChange.toFixed(1)}% gestegen t.o.v. vorige periode`);
      }
      if (profitMargin < 20 && totalIncome > 0) {
        insights.push(`📉 Winstmarge van ${profitMargin.toFixed(1)}% is onder het gezonde niveau (20%+)`);
      }
      if (topCategories.length > 0 && topCategories[0].percentage > 40) {
        insights.push(`💡 ${topCategories[0].category} vormt ${topCategories[0].percentage.toFixed(0)}% van je uitgaven`);
      }
      if (totalVat > 0) {
        insights.push(`🧾 BTW te reserveren: €${totalVat.toFixed(2)}`);
      }

      // Benchmark
      const threeMonthAvg = monthlyData.slice(-3).reduce((sum, m) => sum + m.expenses, 0) / 3;
      const currentExpenses = monthlyData[monthlyData.length - 1]?.expenses || 0;
      const benchmarkDiff = threeMonthAvg > 0 ? ((currentExpenses - threeMonthAvg) / threeMonthAvg) * 100 : 0;
      const benchmark = threeMonthAvg > 0 
        ? `Je kosten liggen ${Math.abs(benchmarkDiff).toFixed(0)}% ${benchmarkDiff > 0 ? 'boven' : 'onder'} je 3-maand gemiddelde`
        : null;

      // Use placeholder data if no real data exists yet
      if (invoices.length === 0 && receipts.length === 0 && transactions.length === 0) {
        setData({
          totalIncome: 15000,
          totalExpenses: 8500,
          profit: 6500,
          profitMargin: 43.3,
          totalVat: 1785,
          previousPeriodComparison: {
            incomeChange: 12.5,
            expenseChange: 5.2,
            profitChange: 8.3
          },
          monthlyData: [
            { month: 'Jan', monthNum: 0, year: 2024, income: 12000, expenses: 7000, profit: 5000 },
            { month: 'Feb', monthNum: 1, year: 2024, income: 13500, expenses: 7500, profit: 6000 },
            { month: 'Mar', monthNum: 2, year: 2024, income: 14000, expenses: 8000, profit: 6000 },
            { month: 'Apr', monthNum: 3, year: 2024, income: 13000, expenses: 7200, profit: 5800 },
            { month: 'May', monthNum: 4, year: 2024, income: 14500, expenses: 8200, profit: 6300 },
            { month: 'Jun', monthNum: 5, year: 2024, income: 15000, expenses: 8500, profit: 6500 },
          ],
          topCategories: [
            { category: 'Software', amount: 2500, percentage: 29.4, vatAmount: 525 },
            { category: 'Marketing', amount: 2000, percentage: 23.5, vatAmount: 420 },
            { category: 'Office', amount: 1500, percentage: 17.6, vatAmount: 315 },
            { category: 'Travel', amount: 1200, percentage: 14.1, vatAmount: 252 },
            { category: 'Utilities', amount: 1300, percentage: 15.3, vatAmount: 273 },
          ],
          insights: [
            '📈 Omzet is 12.5% gestegen t.o.v. vorige maand',
            '💰 Winstmarge van 43.3% is uitstekend',
            '💡 Software vormt 29% van je uitgaven - overweeg jaarlicenties voor korting',
            '🧾 BTW te reserveren: €1.785,00'
          ],
          benchmark: 'Je kosten liggen 3% onder je 3-maand gemiddelde'
        });
        setAiInsights([
          'Je financiële situatie is gezond met een sterke winstmarge.',
          'Software en marketing zijn je grootste kostenposten - dit is normaal voor digitale dienstverlening.',
          'Overweeg kwartaalbetalingen voor software om cashflow te optimaliseren.'
        ]);
      } else {
        setData({
          totalIncome,
          totalExpenses,
          profit,
          profitMargin,
          totalVat,
          previousPeriodComparison: {
            incomeChange,
            expenseChange,
            profitChange
          },
          monthlyData,
          topCategories,
          insights,
          benchmark
        });
        
        // Load AI insights
        loadAiInsights(totalIncome, totalExpenses, profitMargin, topCategories, totalVat);
      }
    } catch (error) {
      console.error('Error loading financial data:', error);
      toast.error(t('error'));
    } finally {
      setLoading(false);
    }
  };

  const loadAiInsights = async (income: number, expenses: number, margin: number, categories: CategoryData[], vat: number) => {
    setLoadingInsights(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: {
          query: `Geef 3 korte, actionable financiële inzichten gebaseerd op: Omzet €${income}, Uitgaven €${expenses}, Marge ${margin.toFixed(1)}%, BTW €${vat}. Top categorieën: ${categories.map(c => `${c.category}: €${c.amount}`).join(', ')}. Focus op cashflow, kostenoptimalisatie en BTW-planning.`,
          type: 'insights',
          conversationHistory: []
        }
      });

      if (!error && data?.answer) {
        const insights = data.answer.split('\n').filter((s: string) => s.trim());
        setAiInsights(insights.slice(0, 3));
      }
    } catch (error) {
      console.error('Error loading AI insights:', error);
    } finally {
      setLoadingInsights(false);
    }
  };

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-foreground mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: €{entry.value.toLocaleString()}
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
          <p className="font-medium text-foreground">{data.category}</p>
          <p className="text-sm text-muted-foreground">€{data.amount.toLocaleString()}</p>
          <p className="text-sm text-muted-foreground">{data.percentage.toFixed(1)}%</p>
          {data.vatAmount > 0 && (
            <p className="text-xs text-muted-foreground">BTW: €{data.vatAmount.toFixed(2)}</p>
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
        {isPositive ? '+' : ''}{value.toFixed(1)}%
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

  if (!data) return null;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t('financialOverview')}</h1>
          <p className="text-muted-foreground">{t('financialOverviewDescription')}</p>
        </div>
        <Select value={period} onValueChange={(v: PeriodFilter) => setPeriod(v)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="month">{t('thisMonth')}</SelectItem>
            <SelectItem value="quarter">{t('thisQuarter')}</SelectItem>
            <SelectItem value="year">{t('thisYear')}</SelectItem>
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
            <div className="text-2xl font-bold text-foreground">€{data.totalIncome.toLocaleString()}</div>
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
            <div className="text-2xl font-bold text-foreground">€{data.totalExpenses.toLocaleString()}</div>
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
            <div className="text-2xl font-bold text-foreground">€{data.profit.toLocaleString()}</div>
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
            <div className="text-2xl font-bold text-foreground">{data.profitMargin.toFixed(1)}%</div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={data.profitMargin > 30 ? 'default' : data.profitMargin > 15 ? 'secondary' : 'destructive'}>
                {data.profitMargin > 30 ? 'Excellent' : data.profitMargin > 15 ? 'Gezond' : 'Let op'}
              </Badge>
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
                <p className="text-sm font-medium text-foreground">BTW te reserveren</p>
                <p className="text-xs text-muted-foreground">Op basis van facturen</p>
              </div>
              <p className="text-xl font-bold text-primary">€{data.totalVat.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('monthlyTrend')}</CardTitle>
            <CardDescription>{t('last6Months')}</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `€${(v/1000).toFixed(0)}k`} />
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
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  innerRadius={50}
                  label={({ category, percentage }) => `${category}: ${percentage.toFixed(0)}%`}
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
              <YAxis stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `€${(v/1000).toFixed(0)}k`} />
              <RechartsTooltip content={<CustomTooltip />} />
              <Bar dataKey="profit" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name={t('profit')} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
