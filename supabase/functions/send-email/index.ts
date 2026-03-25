import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

async function refreshGoogleToken(refreshToken: string): Promise<{ access_token: string; expires_in: number } | null> {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: Deno.env.get("GOOGLE_CLIENT_ID")!,
      client_secret: Deno.env.get("GOOGLE_CLIENT_SECRET")!,
      grant_type: "refresh_token",
    }),
  });
  if (!response.ok) return null;
  return response.json();
}

function createRawEmail(to: string, cc: string, subject: string, body: string, fromEmail: string): string {
  const boundary = 'boundary_' + Date.now();
  const lines = [
    `From: ${fromEmail}`,
    `To: ${to}`,
    ...(cc ? [`Cc: ${cc}`] : []),
    `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
    'MIME-Version: 1.0',
    `Content-Type: text/plain; charset=UTF-8`,
    'Content-Transfer-Encoding: base64',
    '',
    btoa(unescape(encodeURIComponent(body))),
  ];
  const raw = lines.join('\r\n');
  return btoa(raw).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, cc, subject, body, replyToEmailId } = await req.json();
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header');

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('Unauthorized');

    // Get user's active Gmail connection
    const { data: connection, error: connError } = await supabase
      .from('email_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('provider', 'gmail')
      .eq('is_active', true)
      .limit(1)
      .single();

    if (connError || !connection) {
      return new Response(
        JSON.stringify({ error: 'Geen actieve Gmail-koppeling gevonden. Koppel eerst je mailbox.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Refresh token if needed
    let accessToken = connection.access_token;
    const tokenExpiry = new Date(connection.token_expires_at);
    if (tokenExpiry < new Date(Date.now() + 5 * 60 * 1000)) {
      const newTokens = await refreshGoogleToken(connection.refresh_token);
      if (!newTokens) {
        return new Response(
          JSON.stringify({ error: 'Token verlopen. Koppel je Gmail opnieuw.' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      accessToken = newTokens.access_token;
      await supabase
        .from('email_connections')
        .update({
          access_token: accessToken,
          token_expires_at: new Date(Date.now() + newTokens.expires_in * 1000).toISOString(),
        })
        .eq('id', connection.id);
    }

    // Build raw email
    const raw = createRawEmail(to, cc || '', subject, body, connection.email_address);

    // If replying, get the threadId
    let threadId: string | undefined;
    if (replyToEmailId) {
      const { data: originalEmail } = await supabase
        .from('emails')
        .select('thread_id')
        .eq('id', replyToEmailId)
        .eq('user_id', user.id)
        .single();
      threadId = originalEmail?.thread_id || undefined;
    }

    // Send via Gmail API
    const gmailUrl = 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send';
    const gmailBody: any = { raw };
    if (threadId) gmailBody.threadId = threadId;

    const gmailResponse = await fetch(gmailUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(gmailBody),
    });

    if (!gmailResponse.ok) {
      const errorText = await gmailResponse.text();
      console.error('Gmail send error:', errorText);
      throw new Error('E-mail verzenden mislukt via Gmail.');
    }

    const result = await gmailResponse.json();

    return new Response(
      JSON.stringify({ success: true, messageId: result.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error sending email:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
