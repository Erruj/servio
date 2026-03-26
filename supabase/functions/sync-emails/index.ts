import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GMAIL_PAGE_SIZE = 100;
const INITIAL_SYNC_LIMIT = 500;
const INCREMENTAL_SYNC_LIMIT = 200;

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
    console.error("[sync-emails] Failed to refresh Google token:", await response.text());
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
    console.error("[sync-emails] Failed to refresh Microsoft token:", await response.text());
    return null;
  }

  return response.json();
}

interface GmailFetchOptions {
  maxResults: number;
  query?: string;
  includeSpamTrash?: boolean;
}

// Fetch Gmail messages with pagination + optional query
async function fetchGmailMessages(accessToken: string, options: GmailFetchOptions) {
  const messageRefs: Array<{ id: string }> = [];
  let nextPageToken: string | undefined;

  while (messageRefs.length < options.maxResults) {
    const listUrl = new URL("https://gmail.googleapis.com/gmail/v1/users/me/messages");
    listUrl.searchParams.set("maxResults", String(Math.min(GMAIL_PAGE_SIZE, options.maxResults - messageRefs.length)));

    if (options.query) {
      listUrl.searchParams.set("q", options.query);
    }

    if (options.includeSpamTrash) {
      listUrl.searchParams.set("includeSpamTrash", "true");
    }

    if (nextPageToken) {
      listUrl.searchParams.set("pageToken", nextPageToken);
    }

    const listResponse = await fetch(listUrl.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!listResponse.ok) {
      throw new Error(`Gmail list API error [${listResponse.status}]: ${await listResponse.text()}`);
    }

    const listData = await listResponse.json();
    const pageMessages = (listData.messages || []) as Array<{ id: string }>;

    if (pageMessages.length === 0) {
      break;
    }

    messageRefs.push(...pageMessages);
    nextPageToken = listData.nextPageToken;

    if (!nextPageToken) {
      break;
    }
  }

  const trimmedMessageRefs = messageRefs.slice(0, options.maxResults);
  const detailedMessages: any[] = [];

  for (let i = 0; i < trimmedMessageRefs.length; i += 10) {
    const batch = trimmedMessageRefs.slice(i, i + 10);
    const details = await Promise.all(
      batch.map(async (msg) => {
        const msgResponse = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        if (!msgResponse.ok) {
          console.error(`[sync-emails] Failed to fetch Gmail message detail ${msg.id}:`, await msgResponse.text());
          return null;
        }

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
    throw new Error(`Outlook API error [${response.status}]: ${await response.text()}`);
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

async function persistMessages(
  supabase: ReturnType<typeof createClient>,
  connection: { id: string; user_id: string },
  messages: any[]
): Promise<{ insertedCount: number; updatedCount: number }> {
  if (messages.length === 0) {
    return { insertedCount: 0, updatedCount: 0 };
  }

  const externalIds = [...new Set(messages.map((message) => message.external_id).filter(Boolean))];

  const { data: existingRows, error: existingError } = await supabase
    .from("emails")
    .select("id, external_id")
    .eq("connection_id", connection.id)
    .in("external_id", externalIds);

  if (existingError) {
    throw new Error(`Failed to lookup existing emails: ${existingError.message}`);
  }

  const existingByExternalId = new Map((existingRows || []).map((row: { id: string; external_id: string }) => [row.external_id, row.id]));

  const inserts: any[] = [];
  const updates: any[] = [];

  for (const message of messages) {
    const baseRecord = {
      ...message,
      user_id: connection.user_id,
      connection_id: connection.id,
    };

    const existingId = existingByExternalId.get(message.external_id);
    if (existingId) {
      updates.push({ ...baseRecord, id: existingId });
    } else {
      inserts.push(baseRecord);
    }
  }

  const chunkSize = 100;

  for (let i = 0; i < inserts.length; i += chunkSize) {
    const chunk = inserts.slice(i, i + chunkSize);
    const { error: insertError } = await supabase.from("emails").insert(chunk);
    if (insertError) {
      throw new Error(`Failed to insert emails: ${insertError.message}`);
    }
  }

  for (let i = 0; i < updates.length; i += chunkSize) {
    const chunk = updates.slice(i, i + chunkSize);
    const { error: upsertError } = await supabase.from("emails").upsert(chunk, { onConflict: "id" });
    if (upsertError) {
      throw new Error(`Failed to update emails: ${upsertError.message}`);
    }
  }

  return {
    insertedCount: inserts.length,
    updatedCount: updates.length,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(SUPABASE_URL!, Deno.env.get("SUPABASE_ANON_KEY") || SUPABASE_SERVICE_ROLE_KEY!);
    const { data: { user }, error: authError } = await userClient.auth.getUser(authHeader.replace("Bearer ", ""));

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const requestBody = await req.json().catch(() => ({}));
    const forceFullSync = Boolean(requestBody?.force_full_sync);
    const connectionId = typeof requestBody?.connection_id === "string" ? requestBody.connection_id : null;

    const userId = user.id;
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    let connectionQuery = supabase
      .from("email_connections")
      .select("*")
      .eq("user_id", userId);

    if (connectionId) {
      connectionQuery = connectionQuery.eq("id", connectionId);
    }

    const { data: connections, error: connError } = await connectionQuery;

    if (connError) {
      throw new Error(`Failed to fetch connections: ${connError.message}`);
    }

    if (!connections?.length) {
      return new Response(JSON.stringify({ error: "Geen mailboxverbinding gevonden." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[sync-emails] Start sync for user ${userId}. Connections: ${connections.length}`);

    const results: Array<Record<string, unknown>> = [];

    for (const connection of connections) {
      try {
        let accessToken = connection.access_token;
        const tokenExpiry = connection.token_expires_at ? new Date(connection.token_expires_at) : new Date(0);
        const shouldRefreshToken = !connection.is_active || tokenExpiry.getTime() <= Date.now() + 5 * 60 * 1000;

        if (shouldRefreshToken) {
          console.log(`[sync-emails] Refreshing token for ${connection.email_address} (${connection.provider})`);

          let newTokens: { access_token: string; expires_in: number } | null = null;
          if (connection.provider === "gmail") {
            newTokens = await refreshGoogleToken(connection.refresh_token);
          } else if (connection.provider === "outlook") {
            newTokens = await refreshMicrosoftToken(connection.refresh_token);
          }

          if (!newTokens) {
            throw new Error("Token refresh failed. Koppel je mailbox opnieuw.");
          }

          accessToken = newTokens.access_token;
          const newExpiry = new Date(Date.now() + newTokens.expires_in * 1000).toISOString();

          const { error: tokenUpdateError } = await supabase
            .from("email_connections")
            .update({
              access_token: accessToken,
              token_expires_at: newExpiry,
              is_active: true,
              sync_error: null,
            })
            .eq("id", connection.id);

          if (tokenUpdateError) {
            throw new Error(`Failed to update refreshed token: ${tokenUpdateError.message}`);
          }
        }

        let messages: any[] = [];

        if (connection.provider === "gmail") {
          const hasPreviousSync = Boolean(connection.last_sync_at) && !forceFullSync;
          const maxResults = hasPreviousSync ? INCREMENTAL_SYNC_LIMIT : INITIAL_SYNC_LIMIT;
          const bufferedAfterTimestamp = connection.last_sync_at
            ? Math.max(0, new Date(connection.last_sync_at).getTime() - 5 * 60 * 1000)
            : null;
          const query = hasPreviousSync && bufferedAfterTimestamp
            ? `after:${Math.floor(bufferedAfterTimestamp / 1000)}`
            : undefined;

          console.log(
            `[sync-emails] Gmail fetch for ${connection.email_address} | mode=${hasPreviousSync ? "incremental" : "full"} | max=${maxResults} | query=${query || "none"}`
          );

          const rawMessages = await fetchGmailMessages(accessToken, {
            maxResults,
            query,
            includeSpamTrash: true,
          });

          messages = rawMessages.map(parseGmailMessage);
        } else if (connection.provider === "outlook") {
          const maxResults = connection.last_sync_at && !forceFullSync ? INCREMENTAL_SYNC_LIMIT : INITIAL_SYNC_LIMIT;
          console.log(`[sync-emails] Outlook fetch for ${connection.email_address} | max=${maxResults}`);
          const rawMessages = await fetchOutlookMessages(accessToken, maxResults);
          messages = rawMessages.map(parseOutlookMessage);
        } else {
          throw new Error(`Unsupported provider: ${connection.provider}`);
        }

        const { insertedCount, updatedCount } = await persistMessages(supabase, connection, messages);

        const { error: connectionUpdateError } = await supabase
          .from("email_connections")
          .update({
            last_sync_at: new Date().toISOString(),
            sync_error: null,
            is_active: true,
          })
          .eq("id", connection.id);

        if (connectionUpdateError) {
          throw new Error(`Failed to update sync metadata: ${connectionUpdateError.message}`);
        }

        console.log(
          `[sync-emails] Sync success for ${connection.email_address}. fetched=${messages.length}, inserted=${insertedCount}, updated=${updatedCount}`
        );

        results.push({
          connection_id: connection.id,
          status: "success",
          fetched_count: messages.length,
          inserted_count: insertedCount,
          updated_count: updatedCount,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown sync error";
        const shouldDeactivate = /refresh|invalid_grant|unauthorized|reconnect|token/i.test(errorMessage.toLowerCase());

        console.error(`[sync-emails] Sync error for ${connection.email_address}:`, errorMessage);

        await supabase
          .from("email_connections")
          .update({
            sync_error: errorMessage,
            is_active: shouldDeactivate ? false : connection.is_active,
          })
          .eq("id", connection.id);

        results.push({
          connection_id: connection.id,
          status: "error",
          error: errorMessage,
        });
      }
    }

    const successfulSyncs = results.filter((result) => result.status === "success");
    if (successfulSyncs.length === 0) {
      return new Response(
        JSON.stringify({ error: "Synchronisatie mislukt voor alle mailboxen.", results }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An error occurred during email sync";
    console.error("[sync-emails] Fatal error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
