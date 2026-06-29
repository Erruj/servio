import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Notif {
  user_id: string;
  type: string;
  message: string;
  action_url?: string;
  severity?: string;
  dedup_key?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // AuthZ: require cron secret. This is an admin/batch endpoint that reads
  // and writes data across all users using the service role.
  const CRON_SECRET = Deno.env.get("CRON_SECRET");
  const cronHeader = req.headers.get("x-cron-secret");
  if (!CRON_SECRET || cronHeader !== CRON_SECRET) {
    return new Response(JSON.stringify({ error: "Niet geautoriseerd" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );


  try {
    const { data: profiles, error: pErr } = await supabase.from("profiles").select("id");
    if (pErr) throw pErr;

    const now = new Date();
    const d30 = new Date(now.getTime() - 30 * 86400000).toISOString().slice(0, 10);
    const d60 = new Date(now.getTime() - 60 * 86400000).toISOString().slice(0, 10);
    const d14 = new Date(now.getTime() - 14 * 86400000).toISOString();
    const since30 = new Date(now.getTime() - 30 * 86400000).toISOString();
    const todayKey = now.toISOString().slice(0, 10);

    const notifications: Notif[] = [];

    for (const p of profiles ?? []) {
      const uid = p.id;

      // Unpaid invoices > 30 days
      const { data: inv30 } = await supabase
        .from("invoices")
        .select("id, invoice_date, status")
        .eq("user_id", uid)
        .neq("status", "paid")
        .lte("invoice_date", d30);
      const count30 = inv30?.length ?? 0;
      const count60 = (inv30 ?? []).filter((i: any) => i.invoice_date <= d60).length;

      if (count60 > 0) {
        notifications.push({
          user_id: uid,
          type: "invoices_overdue_60",
          severity: "urgent",
          message: `URGENT: Je hebt ${count60} onbetaalde factu${count60 === 1 ? "ur" : "ren"} ouder dan 60 dagen.`,
          action_url: "/app/administration/invoices",
          dedup_key: `inv60-${todayKey}`,
        });
      } else if (count30 > 0) {
        notifications.push({
          user_id: uid,
          type: "invoices_overdue_30",
          severity: "warning",
          message: `Je hebt ${count30} onbetaalde factu${count30 === 1 ? "ur" : "ren"} ouder dan 30 dagen. Wil je een herinnering sturen?`,
          action_url: "/app/administration/invoices",
          dedup_key: `inv30-${todayKey}`,
        });
      }

      // Klacht emails per sender
      const { data: complaints } = await supabase
        .from("emails")
        .select("from_email, from_name, ai_category, received_at")
        .eq("user_id", uid)
        .eq("ai_category", "Klacht")
        .gte("received_at", since30);
      const bySender = new Map<string, { count: number; name?: string }>();
      for (const e of complaints ?? []) {
        const key = (e as any).from_email ?? "unknown";
        const cur = bySender.get(key) ?? { count: 0, name: (e as any).from_name };
        cur.count += 1;
        bySender.set(key, cur);
      }
      for (const [email, info] of bySender) {
        if (info.count >= 3) {
          notifications.push({
            user_id: uid,
            type: "customer_complaints",
            severity: "warning",
            message: `Klant ${info.name || email} stuurt veel klachten (${info.count}). Wil je een automatisch antwoordtemplate instellen?`,
            action_url: "/app/templates",
            dedup_key: `complaints-${email}-${todayKey}`,
          });
        }
      }

      // No transactions in 14 days
      const { data: tx } = await supabase
        .from("transactions")
        .select("id")
        .eq("user_id", uid)
        .gte("created_at", d14)
        .limit(1);
      if (!tx || tx.length === 0) {
        notifications.push({
          user_id: uid,
          type: "no_transactions",
          severity: "info",
          message: "Je hebt 2 weken geen transacties toegevoegd. Alles up to date?",
          action_url: "/app/administration/financial-overview",
          dedup_key: `notx-${todayKey}`,
        });
      }

      // BTW deadline (quarterly: end of Jan/Apr/Jul/Oct)
      const month = now.getMonth() + 1;
      const day = now.getDate();
      const btwMonths = [1, 4, 7, 10];
      if (btwMonths.includes(month) && day >= 15 && day <= 31) {
        const daysLeft = 31 - day;
        notifications.push({
          user_id: uid,
          type: "btw_deadline",
          severity: daysLeft <= 7 ? "urgent" : "warning",
          message: `BTW-aangifte deadline nadert: nog ${daysLeft} dag${daysLeft === 1 ? "" : "en"}.`,
          action_url: "/app/administration/financial-overview",
          dedup_key: `btw-${now.getFullYear()}-${month}`,
        });
      }
    }

    // Insert with dedup (unique partial index handles unread duplicates)
    let inserted = 0;
    for (const n of notifications) {
      const { error } = await supabase.from("ai_notifications").insert(n);
      if (!error) inserted++;
    }

    return new Response(
      JSON.stringify({ ok: true, users: profiles?.length ?? 0, inserted, total_candidates: notifications.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("proactive-insights error", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
