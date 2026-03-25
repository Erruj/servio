import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Refresh Google access token
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

  if (!response.ok) {
    console.error("Failed to refresh Google token:", await response.text());
    return null;
  }

  return response.json();
}

// Refresh Microsoft access token
async function refreshMicrosoftToken(refreshToken: string): Promise<{ access_token: string; expires_in: number } | null> {
  const response = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: Deno.env.get("MICROSOFT_CLIENT_ID")!,
      client_secret: Deno.env.get("MICROSOFT_CLIENT_SECRET")!,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    console.error("Failed to refresh Microsoft token:", await response.text());
    return null;
  }

  return response.json();
}

// Fetch Gmail messages
async function fetchGmailMessages(accessToken: string, maxResults = 50) {
  const listResponse = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}&labelIds=INBOX`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!listResponse.ok) {
    throw new Error(`Gmail API error: ${await listResponse.text()}`);
  }

  const listData = await listResponse.json();
  const messages = listData.messages || [];

  const detailedMessages = [];
  for (let i = 0; i < messages.length; i += 10) {
    const batch = messages.slice(i, i + 10);
    const details = await Promise.all(
      batch.map(async (msg: { id: string }) => {
        const msgResponse = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        if (!msgResponse.ok) return null;
        return msgResponse.json();
      })
    );
    detailedMessages.push(...details.filter(Boolean));
  }

  return detailedMessages;
}

// Fetch Outlook messages
async function fetchOutlookMessages(accessToken: string, maxResults = 50) {
  const response = await fetch(
    `https://graph.microsoft.com/v1.0/me/mailFolders/inbox/messages?$top=${maxResults}&$orderby=receivedDateTime desc&$select=id,conversationId,from,toRecipients,ccRecipients,subject,bodyPreview,body,isRead,hasAttachments,receivedDateTime`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!response.ok) {
    throw new Error(`Outlook API error: ${await response.text()}`);
  }

  const data = await response.json();
  return data.value || [];
}

// Parse Gmail message to our format
function parseGmailMessage(msg: any) {
  const headers = msg.payload?.headers || [];
  const getHeader = (name: string) => headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value;

  const fromHeader = getHeader("From") || "";
  const fromMatch = fromHeader.match(/^(.+?)\s*<(.+?)>$/) || [null, fromHeader, fromHeader];

  let bodyText = "";
  let bodyHtml = "";

  function extractBody(part: any) {
    if (part.mimeType === "text/plain" && part.body?.data) {
      bodyText = atob(part.body.data.replace(/-/g, "+").replace(/_/g, "/"));
    }
    if (part.mimeType === "text/html" && part.body?.data) {
      bodyHtml = atob(part.body.data.replace(/-/g, "+").replace(/_/g, "/"));
    }
    if (part.parts) {
      part.parts.forEach(extractBody);
    }
  }

  if (msg.payload) {
    extractBody(msg.payload);
  }

  return {
    external_id: msg.id,
    thread_id: msg.threadId,
    from_email: fromMatch[2] || fromHeader,
    from_name: fromMatch[1] || null,
    to_emails: (getHeader("To") || "").split(",").map((e: string) => e.trim()).filter(Boolean),
    cc_emails: (getHeader("Cc") || "").split(",").map((e: string) => e.trim()).filter(Boolean),
    subject: getHeader("Subject") || "(No subject)",
    snippet: msg.snippet || "",
    body_text: bodyText,
    body_html: bodyHtml,
    labels: msg.labelIds || [],
    is_read: !msg.labelIds?.includes("UNREAD"),
    is_starred: msg.labelIds?.includes("STARRED") || false,
    has_attachments: msg.payload?.parts?.some((p: any) => p.filename) || false,
    received_at: new Date(parseInt(msg.internalDate)).toISOString(),
  };
}

// Parse Outlook message to our format
function parseOutlookMessage(msg: any) {
  return {
    external_id: msg.id,
    thread_id: msg.conversationId,
    from_email: msg.from?.emailAddress?.address || "",
    from_name: msg.from?.emailAddress?.name || null,
    to_emails: (msg.toRecipients || []).map((r: any) => r.emailAddress?.address).filter(Boolean),
    cc_emails: (msg.ccRecipients || []).map((r: any) => r.emailAddress?.address).filter(Boolean),
    subject: msg.subject || "(No subject)",
    snippet: msg.bodyPreview || "",
    body_text: msg.body?.contentType === "text" ? msg.body?.content : "",
    body_html: msg.body?.contentType === "html" ? msg.body?.content : "",
    labels: [],
    is_read: msg.isRead || false,
    is_starred: false,
    has_attachments: msg.hasAttachments || false,
    received_at: msg.receivedDateTime,
  };
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    // Authenticate the caller via JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create a client with the user's token to verify identity
    const userClient = createClient(SUPABASE_URL!, Deno.env.get("SUPABASE_ANON_KEY") || SUPABASE_SERVICE_ROLE_KEY!);
    const { data: { user }, error: authError } = await userClient.auth.getUser(authHeader.replace("Bearer ", ""));

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Force userId to authenticated user — never trust client input
    const userId = user.id;

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Get only this user's active connections
    const { data: connections, error: connError } = await supabase
      .from("email_connections")
      .select("*")
      .eq("is_active", true)
      .eq("user_id", userId);

    if (connError) {
      throw new Error(`Failed to fetch connections: ${connError.message}`);
    }

    const results = [];

    for (const connection of connections || []) {
      try {
        let accessToken = connection.access_token;

        // Check if token needs refresh
        const tokenExpiry = new Date(connection.token_expires_at);
        if (tokenExpiry < new Date(Date.now() + 5 * 60 * 1000)) {
          console.log(`Refreshing token for ${connection.email_address}`);

          let newTokens;
          if (connection.provider === "gmail") {
            newTokens = await refreshGoogleToken(connection.refresh_token);
          } else if (connection.provider === "outlook") {
            newTokens = await refreshMicrosoftToken(connection.refresh_token);
          }

          if (!newTokens) {
            await supabase
              .from("email_connections")
              .update({
                sync_error: "Failed to refresh token. Please reconnect your account.",
                is_active: false,
              })
              .eq("id", connection.id);

            results.push({
              connection_id: connection.id,
              status: "error",
              error: "Token refresh failed",
            });
            continue;
          }

          accessToken = newTokens.access_token;
          const newExpiry = new Date(Date.now() + newTokens.expires_in * 1000).toISOString();

          await supabase
            .from("email_connections")
            .update({
              access_token: accessToken,
              token_expires_at: newExpiry,
            })
            .eq("id", connection.id);
        }

        // Fetch messages based on provider
        let messages;
        if (connection.provider === "gmail") {
          const rawMessages = await fetchGmailMessages(accessToken);
          messages = rawMessages.map(parseGmailMessage);
        } else if (connection.provider === "outlook") {
          const rawMessages = await fetchOutlookMessages(accessToken);
          messages = rawMessages.map(parseOutlookMessage);
        } else {
          continue;
        }

        // Upsert messages to database
        for (const msg of messages) {
          await supabase.from("emails").upsert(
            {
              ...msg,
              user_id: connection.user_id,
              connection_id: connection.id,
            },
            { onConflict: "connection_id,external_id" }
          );
        }

        // Update last sync time
        await supabase
          .from("email_connections")
          .update({
            last_sync_at: new Date().toISOString(),
            sync_error: null,
          })
          .eq("id", connection.id);

        results.push({
          connection_id: connection.id,
          status: "success",
          synced_count: messages.length,
        });
      } catch (error) {
        console.error(`Sync error for ${connection.email_address}:`, error);

        await supabase
          .from("email_connections")
          .update({
            sync_error: error instanceof Error ? error.message : "Unknown sync error",
          })
          .eq("id", connection.id);

        results.push({
          connection_id: connection.id,
          status: "error",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Sync emails error:", error);
    return new Response(
      JSON.stringify({ error: "An error occurred during email sync" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
