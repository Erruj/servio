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

    const emailContent = email.body_text || email.body_html?.replace(/<[^>]*>/g, '') || email.snippet || '';
    const senderName = email.from_name || email.from_email.split('@')[0];

    const systemPrompt = `Je bent een AI e-mail analist. Analyseer de onderstaande e-mail en geef een gestructureerde analyse.

REGELS:
- Geef een echte, inhoudelijke samenvatting van de e-mail in 1-3 zinnen. Beschrijf WAT de afzender vraagt/zegt, niet het type bericht.
- Geef 2-4 kernpunten die de belangrijkste informatie uit de e-mail bevatten
- Categoriseer de e-mail correct:
  - "Vraag" = als de afzender iets vraagt (prijs, informatie, hulp, etc.)
  - "Klacht" = als de afzender ontevreden is of klaagt
  - "Retour" = als het over retourneren/terugsturen gaat
  - "Factuur" = als het over facturen/betalingen gaat
  - "Technisch" = als het over technische problemen gaat
  - "Overig" = alleen als het echt nergens anders past
- Bepaal urgentie: "Hoog" (dringend, deadline), "Normaal" (standaard), "Laag" (niet tijdgevoelig)
- Bepaal sentiment: "Positief", "Neutraal", of "Negatief"
- Detecteer de taal van de e-mail

ANTWOORD in exact dit JSON formaat (geen markdown, geen code blocks):
{"summary":"<inhoudelijke samenvatting>","bullets":["<kernpunt 1>","<kernpunt 2>"],"category":"<Vraag|Klacht|Retour|Factuur|Technisch|Overig>","urgency":"<Hoog|Normaal|Laag>","sentiment":"<Positief|Neutraal|Negatief>","policyFlags":[]}`;

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
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 1000,
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

    return new Response(
      JSON.stringify({ success: true, analysis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('analyze-email error:', error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
