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

    // Fetch email, profile, settings, recent corrections, and recent sent emails in parallel
    const [emailRes, profileRes, settingsRes, correctionsRes, sentEmailsRes] = await Promise.all([
      supabase.from('emails').select('*').eq('id', emailId).eq('user_id', user.id).single(),
      supabase.from('profiles').select('full_name, company_name, email').eq('id', user.id).single(),
      supabase.from('user_settings').select('ai_tone, language, ai_personality, ai_custom_personality, email_signature, preferred_tone').eq('user_id', user.id).single(),
      supabase.from('ai_corrections').select('original_reply, corrected_reply').eq('user_id', user.id).order('created_at', { ascending: false }).limit(3),
      supabase.from('emails').select('subject, body_text, snippet').eq('user_id', user.id).contains('labels', ['SENT']).order('received_at', { ascending: false }).limit(10),
    ]);

    const email = emailRes.data;
    if (emailRes.error || !email) {
      console.error('generate-reply: Email not found', emailRes.error);
      throw new Error('Email not found');
    }
    console.log('generate-reply: Email found:', email.subject);

    const profile = profileRes.data;
    const settings = settingsRes.data;
    const corrections = correctionsRes.data || [];

    const emailContent = email.body_text || email.body_html?.replace(/<[^>]*>/g, '') || email.snippet || '';
    const senderName = email.from_name || email.from_email.split('@')[0];
    const userName = profile?.full_name || user.email?.split('@')[0] || 'Team';
    const companyName = profile?.company_name || '';
    const emailSignature = settings?.email_signature || '';
    const sentEmails = sentEmailsRes.data || [];

    const preferredTone = tone || settings?.preferred_tone || settings?.ai_tone || 'neutral';
    const replyLanguage = language || settings?.language || 'nl';

    // Determine AI personality
    const aiPersonality = settings?.ai_personality || 'neutral';
    const customPersonality = settings?.ai_custom_personality || '';
    
    let personalityInstruction = '';
    switch (aiPersonality) {
      case 'friendly': personalityInstruction = 'Schrijf warm, persoonlijk en benaderbaar. Gebruik informele maar professionele taal.'; break;
      case 'direct': personalityInstruction = 'Schrijf kort en bondig. Geen overbodige woorden. Kom direct tot de kern.'; break;
      case 'enthusiastic': personalityInstruction = 'Schrijf positief en energiek. Toon oprechte interesse en enthousiasme.'; break;
      case 'custom': personalityInstruction = customPersonality ? `Volg deze stijlinstructie: ${customPersonality}` : ''; break;
      default: personalityInstruction = 'Schrijf professioneel en zakelijk.'; break;
    }

    // Build corrections context
    let correctionsContext = '';
    if (corrections.length > 0) {
      correctionsContext = `\n\nLEER VAN EERDERE CORRECTIES - de gebruiker heeft eerder AI-antwoorden aangepast. Gebruik dit als richtlijn voor stijl en toon:\n`;
      corrections.forEach((c, i) => {
        correctionsContext += `Correctie ${i + 1}:\n- Origineel: "${c.original_reply.substring(0, 200)}..."\n- Aangepast naar: "${c.corrected_reply.substring(0, 200)}..."\n`;
      });
    }

    // Build sent-email style context (user memory)
    let writingStyleContext = '';
    if (sentEmails.length > 0) {
      const samples = sentEmails
        .map((e, i) => {
          const body = (e.body_text || e.snippet || '').replace(/\s+/g, ' ').trim().substring(0, 400);
          return `Email ${i + 1} (onderwerp: "${e.subject || '-'}"): ${body}`;
        })
        .join('\n\n');
      writingStyleContext = `\n\nJe schrijft namens ${userName}${companyName ? ` van ${companyName}` : ''}. Analyseer de schrijfstijl van onderstaande eerder verstuurde emails en match die toon, woordkeus, lengte en formaliteit exact:\n\n${samples}`;
    }

    // Preferred tone memory
    const preferredToneContext = settings?.preferred_tone
      ? `\n\nVOORKEURSTOON VAN DEZE GEBRUIKER (uit eerdere sessies): ${settings.preferred_tone}. Volg deze tenzij de huidige e-mail een andere toon vereist.`
      : '';

    // Build signature instruction
    const signatureInstruction = emailSignature
      ? `\n\nVOEG DEZE HANDTEKENING TOE aan het einde van elk antwoord:\n${emailSignature}`
      : `\n\nOnderteken met: ${userName}${companyName ? ` | ${companyName}` : ''}`;

    const systemPrompt = `Je bent een professionele e-mailassistent. Je taak is om een contextbewust, specifiek antwoord te schrijven op de onderstaande e-mail.

PERSOONLIJKHEID: ${personalityInstruction}

REGELS:
- Lees de e-mail VOLLEDIG en begrijp de vraag, het verzoek of de context
- Schrijf een antwoord dat SPECIFIEK ingaat op de inhoud van de e-mail
- Gebruik de naam van de afzender als aanhef: "${senderName}"
- Detecteer de taal van de inkomende e-mail en antwoord in DEZELFDE taal
- Als de voorkeurstaal "${replyLanguage}" is, gebruik die als fallback
- Pas de toon aan: "${preferredTone}"
- Geen generieke antwoorden - elk antwoord moet uniek zijn voor deze specifieke e-mail
- Geef 3 varianten: Zakelijk, Empathisch, Uitgebreid
${signatureInstruction}${writingStyleContext}${preferredToneContext}${correctionsContext}

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
        model: 'openai/gpt-5',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_completion_tokens: 2000,
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
    
    const content = data.choices?.[0]?.message?.content || '';
    
    let variants;
    try {
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

    // Persist preferred_tone (normalized) for future calls
    try {
      const raw = (preferredTone || '').toString().toLowerCase();
      let normalized: string | null = null;
      if (/formal|formeel|business|zakelijk|professional/.test(raw)) normalized = 'formeel';
      else if (/informal|informeel|casual|friendly|warm|empath/.test(raw)) normalized = 'informeel';
      else if (raw) normalized = 'neutraal';
      if (normalized) {
        await supabase
          .from('user_settings')
          .update({ preferred_tone: normalized })
          .eq('user_id', user.id);
      }
    } catch (e) {
      console.warn('generate-reply: failed to persist preferred_tone', e);
    }

    return new Response(
      JSON.stringify({
        variants,
        provider: 'Lovable AI',
        model: 'openai/gpt-5',
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
