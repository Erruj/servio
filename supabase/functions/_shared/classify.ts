// Achtergrond-classificatie van nieuwe e-mails (categorie, urgentie, sentiment).
// Telt NIET mee voor de AI-calls van het plan. Begrensd per run en per gebruiker per dag.
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const JOB = "classify-emails";
const BATCH = 25;          // mails per AI-verzoek
const MAX_BATCHES = 3;     // AI-verzoeken per run
const DAILY_CAP = 500;     // mails per gebruiker per dag
export const CATEGORIES = ["Klant", "Vraag", "Klacht", "Factuur", "Offerte", "Technisch", "Intern", "Nieuwsbrief", "Overig"];

export function isNewsletter(e: { from_email?: string; body_text?: string | null; body_html?: string | null; labels?: string[] | null }) {
  const from = (e.from_email || "").toLowerCase();
  if (/(^|[._-])(no-?reply|do-?not-?reply|newsletter|nieuwsbrief|mailer|marketing|news|info@mail\.|notifications?)([._@-]|$)/.test(from)) return true;
  const body = `${e.body_text || ""} ${e.body_html || ""}`.toLowerCase();
  return /list-unsubscribe|unsubscribe|uitschrijven|afmelden voor (deze|onze) (nieuwsbrief|mails)/.test(body);
}

const sentimentMap: Record<string, string> = { positief: "positive", neutraal: "neutral", negatief: "negative", ontevreden: "unhappy" };

export async function classifyPendingEmails(supabase: SupabaseClient): Promise<{ classified: number; paused?: string }> {
  const { data: got } = await supabase.rpc("acquire_ai_job_lock", { _job: JOB, _seconds: 300 });
  if (!got) {
    const { data: st } = await supabase.from("ai_job_state").select("paused_reason").eq("job_name", JOB).maybeSingle();
    return { classified: 0, paused: st?.paused_reason ?? "al bezig" };
  }
  let classified = 0;
  try {
    const since = new Date(Date.now() - 30 * 86400_000).toISOString();
    const dayStart = new Date(); dayStart.setUTCHours(0, 0, 0, 0);
    for (let b = 0; b < MAX_BATCHES; b++) {
      const { data: rows } = await supabase.from("emails")
        .select("id, user_id, from_email, from_name, subject, snippet, body_text, body_html, labels")
        .is("ai_classified_at", null).gte("received_at", since)
        .order("received_at", { ascending: false }).limit(BATCH * 2);
      if (!rows?.length) break;

      // Dagelijkse bovengrens per gebruiker
      const users = [...new Set(rows.map((r: any) => r.user_id))];
      const allowed = new Map<string, number>();
      for (const u of users) {
        const { count } = await supabase.from("emails").select("id", { count: "exact", head: true })
          .eq("user_id", u).gte("ai_classified_at", dayStart.toISOString());
        allowed.set(u, Math.max(0, DAILY_CAP - (count ?? 0)));
      }
      const batch = rows.filter((r: any) => { const left = allowed.get(r.user_id)!; if (left <= 0) return false; allowed.set(r.user_id, left - 1); return true; }).slice(0, BATCH);
      if (!batch.length) break;

      const now = new Date().toISOString();
      const news = batch.filter(isNewsletter);
      for (const n of news) {
        await supabase.from("emails").update({ ai_category: "Nieuwsbrief", ai_urgency: "Laag", customer_sentiment: null, ai_classified_at: now }).eq("id", n.id);
        classified++;
      }
      const rest = batch.filter((r: any) => !news.includes(r));
      if (!rest.length) continue;

      const list = rest.map((e: any, i: number) => `#${i}\nVan: ${e.from_name || ""} <${e.from_email}>\nOnderwerp: ${e.subject || "-"}\nTekst: ${(e.body_text || e.snippet || (e.body_html || "").replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").slice(0, 600)}`).join("\n\n");
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: `Classificeer zakelijke e-mails van een Nederlandse ZZP'er. Per mail: category uit [${CATEGORIES.join(", ")}], urgency uit [Hoog, Normaal, Laag] (Hoog = deadline, aanmaning, spoed, vandaag, juridisch), sentiment uit [Positief, Neutraal, Negatief, Ontevreden]. Antwoord ALLEEN met JSON: {"items":[{"i":0,"category":"...","urgency":"...","sentiment":"..."}]}` },
            { role: "user", content: list },
          ],
          response_format: { type: "json_object" },
        }),
      });
      if (res.status === 402 || res.status === 403) {
        const reason = res.status === 402 ? "AI-tegoed op" : "AI-toegang geweigerd";
        await supabase.from("ai_job_state").update({ paused_reason: reason, paused_at: now }).eq("job_name", JOB);
        return { classified, paused: reason };
      }
      if (!res.ok) { console.warn(`[classify] AI ${res.status}: ${(await res.text()).slice(0, 200)}`); break; }
      const json = await res.json();
      let items: any[] = [];
      try { items = JSON.parse((json.choices?.[0]?.message?.content || "{}").replace(/```json|```/g, "")).items || []; } catch { /* leeg */ }
      for (let i = 0; i < rest.length; i++) {
        const it = items.find((x) => Number(x.i) === i) || {};
        const cat = CATEGORIES.includes(it.category) ? it.category : "Overig";
        const urg = ["Hoog", "Normaal", "Laag"].includes(it.urgency) ? it.urgency : "Normaal";
        const sent = sentimentMap[String(it.sentiment || "").toLowerCase()] ?? "neutral";
        await supabase.from("emails").update({ ai_category: cat, ai_urgency: urg, customer_sentiment: sent, ai_classified_at: now }).eq("id", rest[i].id);
        classified++;
      }
    }
  } finally {
    await supabase.from("ai_job_state").update({ locked_until: null, updated_at: new Date().toISOString() }).eq("job_name", JOB);
  }
  return { classified };
}
