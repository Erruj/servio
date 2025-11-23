import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, conversationHistory } = await req.json();
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('Unauthorized');

    // Fetch financial data
    const [transactions, invoices, receipts] = await Promise.all([
      supabase.from('transactions').select('*').eq('user_id', user.id),
      supabase.from('invoices').select('*').eq('user_id', user.id),
      supabase.from('receipts').select('*').eq('user_id', user.id),
    ]);

    // Calculate financial summary
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthlyTransactions = transactions.data?.filter(t => {
      const date = new Date(t.date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    }) || [];

    const monthlyIncome = monthlyTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

    const monthlyExpenses = monthlyTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

    const totalInvoices = invoices.data?.reduce((sum, i) => sum + (parseFloat(i.amount?.toString() || '0')), 0) || 0;
    const totalReceipts = receipts.data?.reduce((sum, r) => sum + (parseFloat(r.amount?.toString() || '0')), 0) || 0;

    // Category breakdown
    const categoryBreakdown: Record<string, number> = {};
    monthlyTransactions.forEach(t => {
      if (t.type === 'expense') {
        categoryBreakdown[t.category] = (categoryBreakdown[t.category] || 0) + parseFloat(t.amount.toString());
      }
    });

    // Build context for AI
    const context = `
Financial Data Summary:
- Monthly Income: €${monthlyIncome.toFixed(2)}
- Monthly Expenses: €${monthlyExpenses.toFixed(2)}
- Net Profit: €${(monthlyIncome - monthlyExpenses).toFixed(2)}
- Total Invoices: €${totalInvoices.toFixed(2)}
- Total Receipts: €${totalReceipts.toFixed(2)}
- Total Transactions: ${monthlyTransactions.length}

Expense Breakdown by Category:
${Object.entries(categoryBreakdown).map(([cat, amount]) => `- ${cat}: €${amount.toFixed(2)}`).join('\n')}

User Question: ${query}
`;

    // Call OpenAI
    const messages = [
      {
        role: 'system',
        content: 'You are a professional financial assistant. Provide clear, actionable insights based on the financial data. Always respond in the same language as the user\'s question. Be concise but thorough. Include specific numbers and percentages when relevant.'
      },
      ...(conversationHistory || []),
      { role: 'user', content: context }
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    const data = await response.json();
    const answer = data.choices[0].message.content;

    return new Response(
      JSON.stringify({ 
        answer,
        metadata: {
          monthlyIncome,
          monthlyExpenses,
          categoryBreakdown,
          transactionCount: monthlyTransactions.length
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in ai-assistant function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
