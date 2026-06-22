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
    const { emailId } = await req.json();
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header');

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('Unauthorized');

    const { data: email, error: emailError } = await supabase
      .from('emails')
      .select('*')
      .eq('id', emailId)
      .eq('user_id', user.id)
      .single();

    if (emailError || !email) throw new Error('Email not found');

    // Fetch up to 50 most-weighted user category corrections as few-shot training data
    const { data: corrections } = await supabase
      .from('email_category_corrections')
      .select('email_subject, email_snippet, sender_email, original_category, corrected_category, correction_count')
      .eq('user_id', user.id)
      .order('correction_count', { ascending: false })
      .order('updated_at', { ascending: false })
      .limit(50);

    // Sender -> most-weighted corrected category map for deterministic match
    const senderMap = new Map<string, { category: string; weight: number }>();
    for (const c of (corrections || []) as any[]) {
      const sender = (c.sender_email || '').toLowerCase().trim();
      if (!sender) continue;
      const existing = senderMap.get(sender);
      const weight = c.correction_count || 1;
      if (!existing || weight > existing.weight) {
        senderMap.set(sender, { category: c.corrected_category, weight });
      }
    }

    const correctionsText = (corrections && corrections.length > 0)
      ? '\n\nLEER VAN DEZE EERDERE CORRECTIES VAN DEZE GEBRUIKER (hoger gewicht = vaker bevestigd, geef hier extra waarde aan):\n' +
        corrections.map((c: any, i: number) =>
          `${i + 1}. [gewicht ${c.correction_count || 1}x] afzender "${c.sender_email || '?'}" | onderwerp "${c.email_subject || '-'}" | snippet "${(c.email_snippet || '').substring(0, 100)}" → categorie "${c.corrected_category}" (was "${c.original_category}")`
        ).join('\n') +
        '\n\nAls de nieuwe e-mail van dezelfde afzender komt of duidelijk lijkt op een correctie hierboven, volg dan die gecorrigeerde categorie en zet "fromCorrection": true in je antwoord.'
      : '';

    const emailContent = email.body_text || email.body_html?.replace(/<[^>]*>/g, '') || email.snippet || '';
    const senderName = email.from_name || email.from_email.split('@')[0];

    const systemPrompt = `Je bent een AI e-mail analist voor een Nederlandse ZZP'er. Analyseer de e-mail en geef een gestructureerde analyse.

REGELS:
- Geef een echte, inhoudelijke samenvatting van de e-mail in 1-3 zinnen
- Geef 2-4 kernpunten
- Categoriseer correct: Vraag | Klacht | Retour | Factuur | Technisch | Overig
- Bepaal urgentie heel zorgvuldig:
  * "Hoog" = bevat woorden zoals: deadline, dringend, urgent, vandaag, asap, spoed, betalingstermijn, juridisch, advocaat, incasso, laatste herinnering, aanmaning, vervalt, verlopen, binnen 24 uur
  * "Normaal" = standaard verzoeken zonder tijdsdruk
  * "Laag" = informatief, nieuwsbrief, update zonder actie nodig
- Bepaal sentiment heel zorgvuldig - er zijn 4 opties:
  * "Positief" = tevreden, dankbaar, blij
  * "Neutraal" = zakelijk, informatief, normaal
  * "Negatief" = ontevreden maar beheerst
  * "Ontevreden" = duidelijk gefrustreerd, boos, klagend, dreigend, eist actie, gebruikt woorden zoals: belachelijk, schandalig, onacceptabel, klacht, teleurgesteld, juridisch, slechte service, nooit meer, geld terug
- Detecteer of dit een ontevreden klant is die empathisch antwoord verdient
${correctionsText}

ANTWOORD in exact dit JSON formaat (geen markdown):
{"summary":"...","bullets":["...","..."],"category":"<Vraag|Klacht|Retour|Factuur|Technisch|Overig>","urgency":"<Hoog|Normaal|Laag>","sentiment":"<Positief|Neutraal|Negatief|Ontevreden>","policyFlags":[],"fromCorrection":false}`;

    const userPrompt = `E-mail van: ${senderName} <${email.from_email}>
Onderwerp: ${email.subject || '(geen onderwerp)'}
Inhoud:
${emailContent.substring(0, 3000)}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-5',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_completion_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error(`AI error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    let analysis;
    try {
      const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      analysis = JSON.parse(cleaned);
    } catch {
      console.warn('Failed to parse AI analysis, using fallback');
      analysis = {
        summary: 'Kon de e-mail niet volledig analyseren.',
        bullets: ['E-mail ontvangen van ' + senderName],
        category: 'Overig',
        urgency: 'Normaal',
        sentiment: 'Neutraal',
        policyFlags: []
      };
    }

    // Deterministic override: if we have a strong sender-based correction, trust it
    const senderKey = (email.from_email || '').toLowerCase().trim();
    const senderHit = senderMap.get(senderKey);
    let fromCorrection = !!analysis.fromCorrection;
    if (senderHit) {
      analysis.category = senderHit.category;
      fromCorrection = true;
    }
    analysis.fromCorrection = fromCorrection;

    // Map "Ontevreden" to a database-friendly sentiment label
    let dbSentiment = (analysis.sentiment || 'Neutraal').toLowerCase();
    if (dbSentiment === 'ontevreden') dbSentiment = 'unhappy';
    else if (dbSentiment === 'positief') dbSentiment = 'positive';
    else if (dbSentiment === 'negatief') dbSentiment = 'negative';
    else dbSentiment = 'neutral';

    // Cache analysis on the email row for priority sorting
    await supabase
      .from('emails')
      .update({
        ai_category: analysis.category,
        ai_urgency: analysis.urgency,
        customer_sentiment: dbSentiment,
        category_from_correction: fromCorrection,
      })
      .eq('id', emailId)
      .eq('user_id', user.id);

    return new Response(
      JSON.stringify({ success: true, analysis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('analyze-email error:', msg);
    
    let userMessage = 'Er is een fout opgetreden bij het analyseren van de e-mail. Probeer het later opnieuw.';
    if (msg.includes('Unauthorized') || msg.includes('authorization')) {
      userMessage = 'Je sessie is verlopen. Log opnieuw in.';
    } else if (msg.includes('rate') || msg.includes('429')) {
      userMessage = 'Je hebt te veel verzoeken gedaan. Wacht even en probeer het opnieuw.';
    } else if (msg.includes('API') || msg.includes('fetch')) {
      userMessage = 'De AI-service is tijdelijk niet beschikbaar. Probeer het later opnieuw.';
    }
    
    return new Response(
      JSON.stringify({ error: userMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
