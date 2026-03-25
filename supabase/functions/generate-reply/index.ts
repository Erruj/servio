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
    const { emailId, tone, language } = await req.json();
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header');

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('Unauthorized');

    // Fetch the email
    const { data: email, error: emailError } = await supabase
      .from('emails')
      .select('*')
      .eq('id', emailId)
      .eq('user_id', user.id)
      .single();

    if (emailError || !email) throw new Error('Email not found');

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
- Geef 3 varianten terug in JSON format

ANTWOORD FORMAT (JSON):
{
  "variants": [
    { "type": "Zakelijk", "label": "Zakelijk", "content": "...", "icon": "💼" },
    { "type": "Empathisch", "label": "Empathisch", "content": "...", "icon": "💝" },
    { "type": "Uitgebreid", "label": "Uitgebreid", "content": "...", "icon": "📋" }
  ]
}`;

    const userPrompt = `E-mail van: ${senderName} <${email.from_email}>
Onderwerp: ${email.subject || '(geen onderwerp)'}
Inhoud:
${emailContent.substring(0, 4000)}`;

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
        tools: [{
          type: 'function',
          function: {
            name: 'generate_reply_variants',
            description: 'Generate 3 reply variants for the email',
            parameters: {
              type: 'object',
              properties: {
                variants: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      type: { type: 'string', enum: ['Zakelijk', 'Empathisch', 'Uitgebreid'] },
                      label: { type: 'string' },
                      content: { type: 'string' },
                      icon: { type: 'string' }
                    },
                    required: ['type', 'label', 'content', 'icon'],
                    additionalProperties: false
                  }
                }
              },
              required: ['variants'],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'generate_reply_variants' } }
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
          JSON.stringify({ error: 'AI credits zijn op.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract from tool call response
    let variants;
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      variants = parsed.variants;
    } else {
      // Fallback: try to parse from content
      const content = data.choices?.[0]?.message?.content || '';
      try {
        const parsed = JSON.parse(content);
        variants = parsed.variants;
      } catch {
        // Ultimate fallback
        variants = [
          { type: 'Zakelijk', label: 'Zakelijk', content: content, icon: '💼' },
        ];
      }
    }

    return new Response(
      JSON.stringify({
        variants,
        provider: 'Lovable AI',
        model: 'gemini-3-flash',
        success: true
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate-reply:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
