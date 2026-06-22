import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, conversationHistory, type, enableActions } = await req.json();
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('Unauthorized');

    // Fetch comprehensive financial data + user memory (profile + subscription tier)
    const [transactions, invoices, receipts, categories, profileRes, settingsRes] = await Promise.all([
      supabase.from('transactions').select('*').eq('user_id', user.id),
      supabase.from('invoices').select('*').eq('user_id', user.id),
      supabase.from('receipts').select('*').eq('user_id', user.id),
      supabase.from('categories').select('*').eq('user_id', user.id),
      supabase.from('profiles').select('full_name, company_name, vat_number').eq('id', user.id).single(),
      supabase.from('user_settings').select('subscription_status, subscription_product_id, trial_end_date').eq('user_id', user.id).single(),
    ]);

    const profile = profileRes.data;
    const settings = settingsRes.data;
    const companyName = profile?.company_name || profile?.full_name || 'jouw bedrijf';
    const vatNumber = profile?.vat_number || '';

    // Map Stripe product id to a readable tier
    const productId = settings?.subscription_product_id || '';
    const starterId = Deno.env.get('STRIPE_STARTER_PRICE_ID') || '';
    const proId = Deno.env.get('STRIPE_PRO_PRICE_ID') || '';
    const businessId = Deno.env.get('STRIPE_BUSINESS_PRICE_ID') || '';
    let subscriptionTier = 'Free / Trial';
    if (productId && productId === businessId) subscriptionTier = 'Business';
    else if (productId && productId === proId) subscriptionTier = 'Pro';
    else if (productId && productId === starterId) subscriptionTier = 'Starter';
    else if (settings?.subscription_status === 'active') subscriptionTier = 'Active';
    else if (settings?.trial_end_date && new Date(settings.trial_end_date) > new Date()) subscriptionTier = 'Trial';

    // Calculate comprehensive financial metrics
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const currentQuarter = Math.floor(currentMonth / 3);

    // Monthly data
    const monthlyTransactions = transactions.data?.filter(t => {
      const date = new Date(t.date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    }) || [];

    // Quarterly data
    const quarterlyTransactions = transactions.data?.filter(t => {
      const date = new Date(t.date);
      const tQuarter = Math.floor(date.getMonth() / 3);
      return tQuarter === currentQuarter && date.getFullYear() === currentYear;
    }) || [];

    // Calculate metrics
    const monthlyIncome = monthlyTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

    const monthlyExpenses = monthlyTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

    const quarterlyIncome = quarterlyTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

    const quarterlyExpenses = quarterlyTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

    // Invoice metrics
    const totalInvoices = invoices.data?.length || 0;
    const paidInvoices = invoices.data?.filter(i => i.status === 'paid') || [];
    const pendingInvoices = invoices.data?.filter(i => i.status === 'pending') || [];
    const overdueInvoices = invoices.data?.filter(i => i.status === 'overdue') || [];
    
    const invoiceTotal = invoices.data?.reduce((sum, i) => sum + (parseFloat(i.amount?.toString() || '0')), 0) || 0;
    const vatTotal = invoices.data?.reduce((sum, i) => sum + (parseFloat(i.vat_amount?.toString() || '0')), 0) || 0;

    // Receipt metrics
    const totalReceipts = receipts.data?.reduce((sum, r) => sum + (parseFloat(r.amount?.toString() || '0')), 0) || 0;

    // Category breakdown
    const categoryBreakdown: Record<string, number> = {};
    [...(transactions.data || []).filter(t => t.type === 'expense'), ...(receipts.data || [])].forEach(item => {
      const cat = item.category || 'other';
      categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + parseFloat(item.amount?.toString() || '0');
    });

    // Top suppliers
    const supplierBreakdown: Record<string, number> = {};
    (invoices.data || []).forEach(inv => {
      const supplier = inv.supplier || 'unknown';
      supplierBreakdown[supplier] = (supplierBreakdown[supplier] || 0) + parseFloat(inv.amount?.toString() || '0');
    });

    const topSuppliers = Object.entries(supplierBreakdown)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // Calculate trends
    const previousMonthTransactions = transactions.data?.filter(t => {
      const date = new Date(t.date);
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      return date.getMonth() === prevMonth && date.getFullYear() === prevYear;
    }) || [];

    const prevMonthExpenses = previousMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

    const expenseGrowth = prevMonthExpenses > 0 
      ? ((monthlyExpenses - prevMonthExpenses) / prevMonthExpenses * 100).toFixed(1) 
      : '0';

    // Last 30 days of transactions (explicit user-memory window)
    const cutoff30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const last30 = (transactions.data || [])
      .filter(t => new Date(t.date) >= cutoff30)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 50);
    const last30Lines = last30.map(t =>
      `- ${t.date} | ${t.type} | €${parseFloat(t.amount?.toString() || '0').toFixed(2)} | ${t.category || '-'} | ${(t.description || '').substring(0, 80)}`
    ).join('\n') || '- (geen transacties in de laatste 30 dagen)';

    // Build comprehensive context for AI
    const context = `
Je bent een professionele financieel adviseur. Antwoord altijd in dezelfde taal als de vraag.

👤 BEDRIJFSPROFIEL:
- Bedrijfsnaam: ${companyName}
- BTW-nummer: ${vatNumber || '(niet ingesteld)'}
- Abonnement: ${subscriptionTier}

ACTUELE FINANCIËLE DATA:

📊 MAANDOVERZICHT (${now.toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' })}):
- Omzet: €${monthlyIncome.toFixed(2)}
- Uitgaven: €${monthlyExpenses.toFixed(2)}
- Nettowinst: €${(monthlyIncome - monthlyExpenses).toFixed(2)}
- Winstmarge: ${monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome * 100).toFixed(1) : 0}%
- Kostengroei t.o.v. vorige maand: ${expenseGrowth}%

📅 KWARTAALOVERZICHT (Q${currentQuarter + 1}):
- Kwartaalomzet: €${quarterlyIncome.toFixed(2)}
- Kwartaaluitgaven: €${quarterlyExpenses.toFixed(2)}
- Kwartaalwinst: €${(quarterlyIncome - quarterlyExpenses).toFixed(2)}

🧾 FACTUREN:
- Totaal aantal: ${totalInvoices}
- Betaald: ${paidInvoices.length} (€${paidInvoices.reduce((s, i) => s + parseFloat(i.amount?.toString() || '0'), 0).toFixed(2)})
- Open: ${pendingInvoices.length} (€${pendingInvoices.reduce((s, i) => s + parseFloat(i.amount?.toString() || '0'), 0).toFixed(2)})
- Verlopen: ${overdueInvoices.length} (€${overdueInvoices.reduce((s, i) => s + parseFloat(i.amount?.toString() || '0'), 0).toFixed(2)})
- Totale factuurwaarde: €${invoiceTotal.toFixed(2)}

💰 BTW:
- Te reserveren BTW: €${vatTotal.toFixed(2)}
- Geschatte kwartaal-BTW: €${(vatTotal * (3 - (currentMonth % 3)) / 3).toFixed(2)}

📁 KOSTENVERDELING PER CATEGORIE:
${Object.entries(categoryBreakdown)
  .sort((a, b) => b[1] - a[1])
  .map(([cat, amount]) => `- ${cat}: €${amount.toFixed(2)} (${((amount / (monthlyExpenses || 1)) * 100).toFixed(0)}%)`)
  .join('\n')}

🏢 TOP 5 LEVERANCIERS:
${topSuppliers.map(([supplier, amount]) => `- ${supplier}: €${amount.toFixed(2)}`).join('\n')}

📝 BONNETJES:
- Totaal verwerkt: €${totalReceipts.toFixed(2)}

🕒 LAATSTE 30 DAGEN TRANSACTIES (max 50):
${last30Lines}

INSTRUCTIES:
- Spreek de gebruiker aan met de bedrijfsnaam waar passend
- Geef concrete, actionable adviezen
- Gebruik specifieke bedragen uit de data
- Bij vragen over BTW, bereken exacte bedragen op basis van werkelijke transacties
- Identificeer risico's en kansen
- Stel vervolgvragen voor als relevant
- Wees beknopt maar volledig

GEBRUIKERSVRAAG: ${query}
`;

    // Determine if we need follow-up suggestions
    let systemPrompt = `Je bent een intelligente financieel assistent. 
Geef duidelijke, professionele antwoorden gebaseerd op de beschikbare data.
Antwoord ALTIJD in dezelfde taal als de vraag van de gebruiker.
Wees specifiek met bedragen en percentages.
Als er actie nodig is, geef concrete stappen.`;

    if (type === 'insights') {
      systemPrompt = `Je bent een financieel analist. 
Geef 3 korte, actionable inzichten (max 1-2 zinnen elk).
Focus op: trends, risico's, bespaarmogelijkheden.
Gebruik emoji's voor visueel onderscheid.`;
    }

    if (type === 'ocr') {
      systemPrompt = `Je bent een OCR-verwerkingsassistent.
Analyseer de beschrijving en extraheer: leverancier, bedrag, BTW, factuurnummer, datum, categorie.
Retourneer als gestructureerde tekst.`;
    }

    // Call Lovable AI Gateway
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          ...(conversationHistory || []).slice(-10), // Keep last 10 messages for context
          { role: 'user', content: context }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Te veel verzoeken. Probeer het over een minuutje opnieuw.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits zijn op. Voeg credits toe in je Lovable workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const answer = data.choices[0].message.content;

    // Generate follow-up suggestion based on context
    let followUp = null;
    if (enableActions && monthlyExpenses > 0) {
      if (parseFloat(expenseGrowth) > 10) {
        followUp = `💡 Je kosten zijn ${expenseGrowth}% gestegen. Wil je dat ik analyseer welke categorieën het meest zijn toegenomen?`;
      } else if (overdueInvoices.length > 0) {
        followUp = `⚠️ Je hebt ${overdueInvoices.length} verlopen facturen. Wil je dat ik een overzicht maak?`;
      }
    }

    return new Response(
      JSON.stringify({ 
        answer,
        followUp,
        metadata: {
          monthlyIncome,
          monthlyExpenses,
          quarterlyIncome,
          quarterlyExpenses,
          categoryBreakdown,
          topSuppliers: Object.fromEntries(topSuppliers),
          vatTotal,
          invoiceCount: totalInvoices,
          pendingCount: pendingInvoices.length,
          overdueCount: overdueInvoices.length,
          transactionCount: monthlyTransactions.length,
          expenseGrowth: parseFloat(expenseGrowth)
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Error in ai-assistant function:', msg);
    
    let userMessage = 'Er is een fout opgetreden. Probeer het later opnieuw.';
    if (msg.includes('Unauthorized') || msg.includes('authorization')) {
      userMessage = 'Je sessie is verlopen. Log opnieuw in.';
    } else if (msg.includes('rate') || msg.includes('429')) {
      userMessage = 'Je hebt te veel verzoeken gedaan. Wacht even en probeer het opnieuw.';
    }
    
    return new Response(
      JSON.stringify({ error: userMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
