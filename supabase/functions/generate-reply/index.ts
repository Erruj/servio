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

async function safeQuery<T>(label: string, fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    const result = await fn();
    console.log(`[generate-reply] ${label}: ok`);
    return result;
  } catch (e) {
    console.warn(`[generate-reply] ${label}: failed, using fallback`, e instanceof Error ? e.message : e);
    return fallback;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[generate-reply] start');
    const { emailId, tone, language } = await req.json();
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header');

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('Unauthorized');
    console.log('[generate-reply] user authenticated', user.id);

    // Required: the email itself. If this fails we cannot proceed.
    const { data: email, error: emailError } = await supabase
      .from('emails').select('*').eq('id', emailId).eq('user_id', user.id).single();
    if (emailError || !email) {
      console.error('[generate-reply] email lookup failed', emailError);
      throw new Error('Email not found');
    }
    console.log('[generate-reply] email loaded:', email.subject);

    // Optional context — every call wrapped so a failure cannot block reply generation
    const profile = await safeQuery('profiles fetch', async () => {
      const { data } = await supabase.from('profiles').select('full_name, company_name, email').eq('id', user.id).single();
      return data;
    }, null as any);

    const settings = await safeQuery('user_settings fetch', async () => {
      const { data } = await supabase.from('user_settings')
        .select('ai_tone, language, ai_personality, ai_custom_personality, email_signature, preferred_tone')
        .eq('user_id', user.id).single();
      return data;
    }, null as any);

    const corrections = await safeQuery('ai_corrections fetch', async () => {
      const { data } = await supabase.from('ai_corrections')
        .select('original_reply, corrected_reply, correction_type')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }).limit(5);
      return data || [];
    }, [] as any[]);

    const sentEmails = await safeQuery('sent emails fetch', async () => {
      const { data } = await supabase.from('emails')
        .select('subject, body_text, snippet')
        .eq('user_id', user.id)
        .contains('labels', ['SENT'])
        .order('received_at', { ascending: false }).limit(10);
      return data || [];
    }, [] as any[]);

    const emailContent = email.body_text || email.body_html?.replace(/<[^>]*>/g, '') || email.snippet || '';
    const senderName = email.from_name || email.from_email.split('@')[0];
    const userName = profile?.full_name || user.email?.split('@')[0] || 'Team';
    const companyName = profile?.company_name || '';
    const emailSignature = settings?.email_signature || '';

    // Fallback to "neutraal" when nothing is set
    const preferredTone = tone || settings?.preferred_tone || settings?.ai_tone || 'neutraal';
    const replyLanguage = language || settings?.language || 'nl';

    const aiPersonality = settings?.ai_personality || 'neutral';
    const customPersonality = settings?.ai_custom_personality || '';

    let personalityInstruction = 'Schrijf professioneel en zakelijk.';
    switch (aiPersonality) {
      case 'friendly': personalityInstruction = 'Schrijf warm, persoonlijk en benaderbaar. Gebruik informele maar professionele taal.'; break;
      case 'direct': personalityInstruction = 'Schrijf kort en bondig. Geen overbodige woorden. Kom direct tot de kern.'; break;
      case 'enthusiastic': personalityInstruction = 'Schrijf positief en energiek. Toon oprechte interesse en enthousiasme.'; break;
      case 'custom': personalityInstruction = customPersonality || personalityInstruction; break;
    }

    let correctionsContext = '';
    if (corrections.length > 0) {
      const edits = corrections.filter((c: any) => c.correction_type !== 'rejected');
      const rejected = corrections.filter((c: any) => c.correction_type === 'rejected');
      if (edits.length > 0) {
        correctionsContext += `\n\nLEER VAN EERDERE CORRECTIES - de gebruiker heeft AI-antwoorden bijgesteld. Match deze stijl en toon:\n`;
        edits.forEach((c: any, i: number) => {
          correctionsContext += `Correctie ${i + 1}:\n- AI schreef: "${(c.original_reply || '').substring(0, 200)}"\n- Gebruiker maakte: "${(c.corrected_reply || '').substring(0, 200)}"\n`;
        });
      }
      if (rejected.length > 0) {
        correctionsContext += `\n\nNEGATIEF SIGNAAL - deze eerdere AI-suggesties werden verworpen zonder aanpassing. Vermijd deze toon/structuur:\n`;
        rejected.forEach((c: any, i: number) => {
          correctionsContext += `Verworpen ${i + 1}: "${(c.original_reply || '').substring(0, 200)}"\n`;
        });
      }
    }

    let writingStyleContext = '';
    if (sentEmails.length > 0) {
      const samples = sentEmails
        .map((e: any, i: number) => {
          const body = (e.body_text || e.snippet || '').replace(/\s+/g, ' ').trim().substring(0, 400);
          return `Email ${i + 1} (onderwerp: "${e.subject || '-'}"): ${body}`;
        })
        .join('\n\n');
      writingStyleContext = `\n\nJe schrijft namens ${userName}${companyName ? ` van ${companyName}` : ''}. Analyseer de schrijfstijl van onderstaande eerder verstuurde emails en match die toon, woordkeus, lengte en formaliteit:\n\n${samples}`;
    } else {
      writingStyleContext = `\n\nJe schrijft namens ${userName}${companyName ? ` van ${companyName}` : ''}. Gebruik een standaard professionele Nederlandse zakelijke stijl.`;
    }

    const preferredToneContext = settings?.preferred_tone
      ? `\n\nVOORKEURSTOON VAN DEZE GEBRUIKER: ${settings.preferred_tone}.`
      : '';

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

BELANGRIJK - ONVOLDOENDE CONTEXT:
Als de e-mail te vaag, dubbelzinnig, of onvoldoende informatie bevat om een zinvol antwoord te geven (bijv. alleen "hoi" zonder verdere context, of een verzoek zonder essentiële details zoals ordernummer/bedrag/datum), forceer dan GEEN antwoord. Geef in plaats daarvan een antwoord dat:
1. De ontvangen boodschap kort bevestigt
2. Beleefd de specifieke ontbrekende informatie opvraagt die nodig is om te kunnen helpen
3. NIET verzint of aannames doet over wat de afzender bedoelt
Doe dit alleen wanneer nodig — de meeste e-mails bevatten genoeg context.
${signatureInstruction}${writingStyleContext}${preferredToneContext}${correctionsContext}

ANTWOORD: Geef exact dit JSON formaat terug (geen markdown, geen code blocks, alleen raw JSON):
{"variants":[{"type":"Zakelijk","label":"Zakelijk","content":"<zakelijk antwoord>","icon":"💼"},{"type":"Empathisch","label":"Empathisch","content":"<empathisch antwoord>","icon":"💝"},{"type":"Uitgebreid","label":"Uitgebreid","content":"<uitgebreid antwoord>","icon":"📋"}]}`;

    const userPrompt = `E-mail van: ${senderName} <${email.from_email}>
Onderwerp: ${email.subject || '(geen onderwerp)'}
Inhoud:
${emailContent.substring(0, 3000)}`;

    console.log('[generate-reply] calling AI Gateway (gemini-2.5-flash)');
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
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[generate-reply] AI Gateway error', response.status, errorText);
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Te veel verzoeken aan de AI. Probeer het over een minuutje opnieuw.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI-credits zijn op. Vul je tegoed aan om verder te kunnen antwoorden.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    console.log('[generate-reply] AI response received');

    let variants;
    try {
      const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      variants = JSON.parse(cleaned).variants;
    } catch {
      console.warn('[generate-reply] JSON parse failed, returning single variant');
      variants = [{ type: 'Zakelijk', label: 'Zakelijk', content, icon: '💼' }];
    }

    // Persist preferred_tone (best-effort)
    try {
      const raw = (preferredTone || '').toString().toLowerCase();
      let normalized: string | null = null;
      if (/formal|formeel|business|zakelijk|professional/.test(raw)) normalized = 'formeel';
      else if (/informal|informeel|casual|friendly|warm|empath/.test(raw)) normalized = 'informeel';
      else if (raw) normalized = 'neutraal';
      if (normalized) {
        await supabase.from('user_settings').update({ preferred_tone: normalized }).eq('user_id', user.id);
      }
    } catch (e) {
      console.warn('[generate-reply] persist preferred_tone failed', e);
    }

    console.log('[generate-reply] success, variants:', variants?.length);
    return new Response(
      JSON.stringify({ variants, provider: 'Lovable AI', model: 'google/gemini-2.5-flash', success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[generate-reply] fatal error:', msg);

    let userMessage = 'Antwoord genereren mislukt. Probeer het later opnieuw.';
    if (msg.includes('Unauthorized') || msg.includes('authorization')) {
      userMessage = 'Je sessie is verlopen. Log opnieuw in om antwoorden te genereren.';
    } else if (msg.includes('Email not found')) {
      userMessage = 'De e-mail waarvoor je een antwoord wilt kon niet worden gevonden.';
    } else if (msg.includes('429') || msg.includes('rate')) {
      userMessage = 'Te veel verzoeken aan de AI. Wacht een minuut en probeer opnieuw.';
    } else if (msg.includes('AI Gateway')) {
      userMessage = 'De AI-service is tijdelijk niet bereikbaar voor het genereren van antwoorden. Probeer het over een minuut opnieuw.';
    }

    return new Response(
      JSON.stringify({ error: userMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
