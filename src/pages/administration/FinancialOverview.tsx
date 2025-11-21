import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, TrendingDown, DollarSign, Wallet } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface FinancialData {
  totalIncome: number;
  totalExpenses: number;
  profit: number;
  monthlyData: { month: string; income: number; expenses: number }[];
  topCategories: { category: string; amount: number }[];
  aiSummary: string;
}

export default function FinancialOverview() {
  const { t } = useTranslation();
  const [data, setData] = useState<FinancialData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFinancialData();
  }, []);

  const loadFinancialData = async () => {
    try {
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      // Get transactions for current month
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('*')
        .gte('date', firstDayOfMonth.toISOString().split('T')[0]);

      if (error) throw error;

      if (!transactions || transactions.length === 0) {
        // Generate dummy data for demonstration
        setData({
          totalIncome: 15000,
          totalExpenses: 8500,
          profit: 6500,
          monthlyData: [
            { month: 'Jan', income: 12000, expenses: 7000 },
            { month: 'Feb', income: 13500, expenses: 7500 },
            { month: 'Mar', income: 14000, expenses: 8000 },
            { month: 'Apr', income: 13000, expenses: 7200 },
            { month: 'May', income: 14500, expenses: 8200 },
            { month: 'Jun', income: 15000, expenses: 8500 },
          ],
          topCategories: [
            { category: 'Software', amount: 2500 },
            { category: 'Marketing', amount: 2000 },
            { category: 'Office', amount: 1500 },
            { category: 'Travel', amount: 1200 },
            { category: 'Utilities', amount: 1300 },
          ],
          aiSummary: t('aiFinancialSummary') || 'Je hebt deze maand een gezonde winstmarge van 43%. Uitgaven zijn stabiel, met de grootste kosten in software en marketing.'
        });
      } else {
        // Calculate real data
        const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
        const expenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
        
        setData({
          totalIncome: income,
          totalExpenses: expenses,
          profit: income - expenses,
          monthlyData: [],
          topCategories: [],
          aiSummary: 'Data wordt geladen...'
        });
      }
    } catch (error) {
      console.error('Error loading financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">{t('loading')}...</div>
      </div>
    );
  }

  if (!data) return null;

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))', 'hsl(var(--destructive))'];

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">{t('financialOverview')}</h1>
        <p className="text-muted-foreground">{t('financialOverviewDescription')}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('totalIncome')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">€{data.totalIncome.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{t('thisMonth')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('totalExpenses')}</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">€{data.totalExpenses.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{t('thisMonth')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('profit')}</CardTitle>
            <Wallet className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">€{data.profit.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{t('thisMonth')}</p>
          </CardContent>
        </Card>
      </div>

      {/* AI Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            {t('aiFinancialInsight')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-foreground">{data.aiSummary}</p>
        </CardContent>
      </Card>

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
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Line type="monotone" dataKey="income" stroke="hsl(var(--primary))" strokeWidth={2} name={t('income')} />
                <Line type="monotone" dataKey="expenses" stroke="hsl(var(--destructive))" strokeWidth={2} name={t('expenses')} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('topExpenseCategories')}</CardTitle>
            <CardDescription>{t('thisMonth')}</CardDescription>
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
                  outerRadius={100}
                  label={(entry) => `${entry.category}: €${entry.amount}`}
                >
                  {data.topCategories.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
