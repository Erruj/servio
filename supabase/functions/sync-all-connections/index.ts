// Cron-getriggerde achtergrond-synchronisatie voor ALLE actieve mailboxen.
// Roept sync-emails per connectie aan (parallel in kleine batches) zodat één
// trage mailbox de rest niet blokkeert en de functie niet time-out.
// Auth: vereist CRON_SECRET in de x-cron-secret header (of Authorization: Bearer <CRON_SECRET>).

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { timingSafeEqual } from "../_shared/security.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CRON_SECRET = Deno.env.get("CRON_SECRET")!;

const BATCH_SIZE = 3;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const provided =
    req.headers.get("x-cron-secret") ||
    (req.headers.get("Authorization") || "").replace("Bearer ", "");

  if (!CRON_SECRET || !timingSafeEqual(provided, CRON_SECRET)) {
    return new Response(JSON.stringify({ error: "Niet geautoriseerd." }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { data: connections, error } = await supabase
      .from("email_connections")
      .select("id, email_address, provider, last_sync_at")
      .eq("is_active", true)
      .order("last_sync_at", { ascending: true, nullsFirst: true });

    if (error) throw new Error(`Kon verbindingen niet ophalen: ${error.message}`);

    const list = connections || [];
    console.log(`[sync-all-connections] Start achtergrond-sync voor ${list.length} actieve mailbox(en)`);

    const results: Array<Record<string, unknown>> = [];

    for (let i = 0; i < list.length; i += BATCH_SIZE) {
      const batch = list.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(
        batch.map(async (conn: any) => {
          try {
            const response = await fetch(`${SUPABASE_URL}/functions/v1/sync-emails`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-cron-secret": CRON_SECRET,
                apikey: SERVICE_ROLE_KEY,
              },
              body: JSON.stringify({ connection_id: conn.id }),
            });
            const payload = await response.json().catch(() => ({}));
            if (!response.ok) {
              console.error(`[sync-all-connections] Fout voor ${conn.email_address}:`, payload?.error || response.status);
              return { connection_id: conn.id, status: "error", error: payload?.error || `HTTP ${response.status}` };
            }
            const inner = Array.isArray(payload?.results) ? payload.results[0] : null;
            return {
              connection_id: conn.id,
              status: inner?.status || "success",
              inserted_count: inner?.inserted_count ?? 0,
              error: inner?.error,
            };
          } catch (e) {
            const message = e instanceof Error ? e.message : String(e);
            console.error(`[sync-all-connections] Netwerkfout voor ${conn.email_address}:`, message);
            return { connection_id: conn.id, status: "error", error: message };
          }
        })
      );
      results.push(...batchResults);
    }

    const succeeded = results.filter((r) => r.status === "success").length;
    const inserted = results.reduce((t, r) => t + (Number(r.inserted_count) || 0), 0);
    console.log(`[sync-all-connections] Klaar: ${succeeded}/${results.length} geslaagd, ${inserted} nieuwe e-mail(s)`);

    return new Response(
      JSON.stringify({ success: true, total: results.length, succeeded, new_emails: inserted, results }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "Onbekende fout tijdens achtergrond-synchronisatie";
    console.error("[sync-all-connections] Fatale fout:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
