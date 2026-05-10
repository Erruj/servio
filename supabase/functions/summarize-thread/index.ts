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
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { emailId, force } = await req.json();
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header');

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('Unauthorized');

    const { data: email } = await supabase
      .from('emails')
      .select('*')
      .eq('id', emailId)
      .eq('user_id', user.id)
      .single();
    if (!email) throw new Error('Email not found');

    // Find thread emails
    const threadKey = email.thread_id;
    let threadEmails: any[] = [email];
    if (threadKey) {
      const { data } = await supabase
        .from('emails')
        .select('id, from_name, from_email, subject, body_text, body_html, snippet, received_at, thread_summary, thread_summary_updated_at')
        .eq('user_id', user.id)
        .eq('thread_id', threadKey)
        .order('received_at', { ascending: true });
      if (data && data.length > 0) threadEmails = data;
    }

    // If only 1 email, no summary needed
    if (threadEmails.length < 2) {
      return new Response(
        JSON.stringify({ success: true, summary: null, messageCount: 1 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use cached summary if recent (< 24h) and not forced
    const latest = threadEmails[threadEmails.length - 1];
    if (!force && latest.thread_summary && latest.thread_summary_updated_at) {
      const ageMs = Date.now() - new Date(latest.thread_summary_updated_at).getTime();
      if (ageMs < 24 * 60 * 60 * 1000) {
        return new Response(
          JSON.stringify({ success: true, summary: latest.thread_summary, messageCount: threadEmails.length, cached: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const conversationText = threadEmails.map((e, i) => {
      const body = e.body_text || (e.body_html || '').replace(/<[^>]*>/g, '') || e.snippet || '';
      return `[Bericht ${i + 1} - ${new Date(e.received_at).toLocaleDateString('nl-NL')}]
Van: ${e.from_name || e.from_email}
Onderwerp: ${e.subject || '(geen)'}
${body.substring(0, 1500)}`;
    }).join('\n\n---\n\n');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: 'Je bent een AI assistent die email-conversaties samenvat. Geef een heldere samenvatting van de hele thread in exact 3 zinnen in het Nederlands. Eerste zin: waar gaat het over. Tweede zin: wat is er besproken/afgesproken. Derde zin: wat is de huidige status of openstaande actie. Geen opsomming, geen markdown, alleen 3 zinnen.' },
          { role: 'user', content: `Vat deze email-conversatie samen (${threadEmails.length} berichten):\n\n${conversationText.substring(0, 8000)}` }
        ],
        temperature: 0.3,
        max_tokens: 400,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error(`AI error: ${response.status}`);
    }

    const data = await response.json();
    const summary = (data.choices?.[0]?.message?.content || '').trim();

    // Cache summary on all emails in thread
    const ids = threadEmails.map(e => e.id);
    await supabase
      .from('emails')
      .update({ thread_summary: summary, thread_summary_updated_at: new Date().toISOString() })
      .in('id', ids)
      .eq('user_id', user.id);

    return new Response(
      JSON.stringify({ success: true, summary, messageCount: threadEmails.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('summarize-thread error:', msg);
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
