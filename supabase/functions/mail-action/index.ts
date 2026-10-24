// Voert een mailactie uit in de echte mailbox (IMAP of Outlook) en werkt daarna de database bij.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { safeLogBody } from "../_shared/security.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

import { ACTIONS, applyMailboxAction, MailboxError, type Action } from "../_shared/mailbox-actions.ts";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MOVE_TARGET: Partial<Record<Action,string>> = {archive:'archive',trash:'trash',spam:'spam',inbox:'inbox'};
const json = (body:unknown,status=200) => new Response(JSON.stringify(body),{status,headers:{...corsHeaders,'Content-Type':'application/json'}});

// ─── Handler ─────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Alleen POST is toegestaan." }, 405);

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return json({ error: "Niet ingelogd." }, 401);
  const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY") || SERVICE);
  const { data: { user }, error: authError } = await userClient.auth.getUser(auth.slice(7));
  if (authError || !user) return json({ error: "Je sessie is verlopen. Log opnieuw in." }, 401);

  const body = await req.json().catch(() => null);
  const emailId = body?.email_id;
  const action = body?.action as Action;
  if (typeof emailId !== "string" || !UUID_RE.test(emailId)) return json({ error: "Ongeldig e-mail-id." }, 400);
  if (!ACTIONS.includes(action)) return json({ error: "Onbekende actie." }, 400);

  const supabase = createClient(SUPABASE_URL, SERVICE);
  const { data: email } = await supabase
    .from("emails").select("id, user_id, connection_id, external_id, folder, is_read, is_starred")
    .eq("id", emailId).eq("user_id", user.id).maybeSingle();
  if (!email) return json({ error: "Deze mail is niet gevonden." }, 404);

  const update: Record<string, unknown> = {};
  if (action === "read" || action === "unread") update.is_read = action === "read";
  if (action === "star" || action === "unstar") update.is_starred = action === "star";
  if (MOVE_TARGET[action]) update.folder = MOVE_TARGET[action];

  let mailboxSynced = false;
  try {
    if (email.connection_id) {
      const { data: conn } = await supabase.from("email_connections").select("*").eq("id", email.connection_id).eq("user_id", user.id).maybeSingle();
      if (conn?.provider === "imap" || conn?.provider === "outlook") {
        const newId = await applyMailboxAction(supabase,conn,email,action);
        if(newId) update.external_id=newId;
        mailboxSynced=true;
      }
      // Gmail: (nog) geen terug-synchronisatie; alleen Servio wordt bijgewerkt.
    }
  } catch (e) {
    const msg = e instanceof MailboxError ? e.message : "Kon de mailbox niet bijwerken.";
    console.error(`[mail-action] ${action} failed for email ${emailId}:`, e instanceof Error ? e.message : e);
    return json({ error: msg }, e instanceof MailboxError ? e.status : 502);
  }

  const { error: upErr } = await supabase.from("emails").update(update).eq("id", emailId).eq("user_id", user.id);
  if (upErr) return json({ error: "De mailbox is bijgewerkt, maar Servio kon de wijziging niet opslaan." }, 500);
  return json({ success: true, mailbox_synced: mailboxSynced });
});
