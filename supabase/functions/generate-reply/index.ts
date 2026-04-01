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
    console.log('generate-reply: Request received');
    const { emailId, tone, language } = await req.json();
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header');

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('Unauthorized');
    console.log('generate-reply: User authenticated:', user.id);

    // Fetch the email
    const { data: email, error: emailError } = await supabase
      .from('emails')
      .select('*')
      .eq('id', emailId)
      .eq('user_id', user.id)
      .single();

    if (emailError || !email) {
      console.error('generate-reply: Email not found', emailError);
      throw new Error('Email not found');
    }
    console.log('generate-reply: Email found:', email.subject);

    // Fetch user profile for signature
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, company_name')
      .eq('id', user.id)
      .single();

    // Fetch user settings for AI tone preference
    const { data: settings } = await supabase
      .from('user_settings')
      .select('ai_tone, language')
      .eq('user_id', user.id)
      .single();

    const emailContent = email.body_text || email.body_html?.replace(/<[^>]*>/g, '') || email.snippet || '';
    const senderName = email.from_name || email.from_email.split('@')[0];
    const userName = profile?.full_name || user.email?.split('@')[0] || 'Team';
    const companyName = profile?.company_name || '';

    const preferredTone = tone || settings?.ai_tone || 'neutral';
    const replyLanguage = language || settings?.language || 'nl';

    const systemPrompt = `Je bent een professionele e-mailassistent. Je taak is om een contextbewust, specifiek antwoord te schrijven op de onderstaande e-mail.

REGELS:
- Lees de e-mail VOLLEDIG en begrijp de vraag, het verzoek of de context
- Schrijf een antwoord dat SPECIFIEK ingaat op de inhoud van de e-mail
- Gebruik de naam van de afzender als aanhef: "${senderName}"
- Onderteken met de naam van de gebruiker: "${userName}"${companyName ? ` van ${companyName}` : ''}
- Detecteer de taal van de inkomende e-mail en antwoord in DEZELFDE taal
- Als de voorkeurstaal "${replyLanguage}" is, gebruik die als fallback
- Pas de toon aan: "${preferredTone}" (neutral=zakelijk, empathetic=empathisch, formal=formeel, detailed=gedetailleerd)
- Geen generieke antwoorden - elk antwoord moet uniek zijn voor deze specifieke e-mail
- Geef 3 varianten: Zakelijk, Empathisch, Uitgebreid

ANTWOORD: Geef exact dit JSON formaat terug (geen markdown, geen code blocks, alleen raw JSON):
{"variants":[{"type":"Zakelijk","label":"Zakelijk","content":"<zakelijk antwoord>","icon":"💼"},{"type":"Empathisch","label":"Empathisch","content":"<empathisch antwoord>","icon":"💝"},{"type":"Uitgebreid","label":"Uitgebreid","content":"<uitgebreid antwoord>","icon":"📋"}]}`;

    const userPrompt = `E-mail van: ${senderName} <${email.from_email}>
Onderwerp: ${email.subject || '(geen onderwerp)'}
Inhoud:
${emailContent.substring(0, 3000)}`;

    console.log('generate-reply: Calling AI Gateway...');
    
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
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('generate-reply: AI Gateway error:', response.status, errorText);
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Te veel verzoeken. Probeer het over een minuutje opnieuw.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits zijn op.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`AI Gateway error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('generate-reply: AI response received');
    
    // Extract content from response
    const content = data.choices?.[0]?.message?.content || '';
    
    let variants;
    try {
      // Try to parse JSON directly
      const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);
      variants = parsed.variants;
    } catch (parseError) {
      console.warn('generate-reply: Failed to parse JSON, using content as single variant');
      variants = [
        { type: 'Zakelijk', label: 'Zakelijk', content: content, icon: '💼' },
      ];
    }

    console.log('generate-reply: Success, returning', variants?.length, 'variants');

    return new Response(
      JSON.stringify({
        variants,
        provider: 'Lovable AI',
        model: 'google/gemini-3-flash-preview',
        success: true
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('generate-reply: Error:', msg);
    
    let userMessage = 'Er is een fout opgetreden bij het genereren van antwoorden. Probeer het later opnieuw.';
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
