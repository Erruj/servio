// Server-side afdwinging en bijhouden van maandelijkse gebruikslimieten.
// Gespiegeld aan src/hooks/useFeatureAccess.ts (limits.emailsPerMonth / aiCallsPerMonth).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type Kind = "email" | "ai";

const LIMITS: Record<string, { email: number | null; ai: number | null }> = {
  free: { email: 20, ai: 10 },
  starter: { email: 100, ai: 50 },
  pro: { email: null, ai: null },
  business: { email: null, ai: null },
};

const PRODUCT_TIER_MAP: Record<string, string> = {
  prod_U9FEn3lMyxZ6xR: "starter",
  prod_U9FG9hWuBCWWMc: "pro",
  prod_U9FHgm6gn3Iq50: "business",
  prod_TUHktvw98PDTTn: "starter",
  prod_TUHkdkFCR6tlSm: "pro",
  prod_TUHl8Gz4fh6OIL: "business",
};

function admin() {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });
}

async function resolveTier(db: ReturnType<typeof admin>, userId: string): Promise<string> {
  const { data: s } = await db
    .from("user_settings")
    .select("subscription_status, subscription_product_id, subscription_tier, trial_end_date")
    .eq("user_id", userId)
    .maybeSingle();
  if (s?.subscription_status === "active") {
    return s.subscription_tier || (s.subscription_product_id ? PRODUCT_TIER_MAP[s.subscription_product_id] || "pro" : "pro");
  }
  const trialActive = s?.trial_end_date ? new Date(s.trial_end_date).getTime() > Date.now() : false;
  if (trialActive && s?.subscription_status !== "free") return "pro";
  return "free";
}

/**
 * Hoogt de teller op als de limiet nog niet bereikt is.
 * Geeft een 429-Response terug als de limiet bereikt is, anders null.
 */
export async function consumeUsageOrReject(
  userId: string,
  kind: Kind,
  corsHeaders: Record<string, string>,
): Promise<Response | null> {
  const db = admin();
  const tier = await resolveTier(db, userId);
  const limit = (LIMITS[tier] ?? LIMITS.free)[kind];
  const { data, error } = await db.rpc("consume_usage", { _user_id: userId, _kind: kind, _limit: limit });
  if (error) {
    console.error("[usage] teller ophogen mislukt", error.message);
    return null; // niet blokkeren bij een interne fout
  }
  if (data === true) return null;
  const msg = kind === "ai"
    ? `Je hebt je maandlimiet van ${limit} AI-acties bereikt. Upgrade je abonnement om verder te gaan.`
    : `Je hebt je maandlimiet van ${limit} verstuurde e-mails bereikt. Upgrade je abonnement om verder te gaan.`;
  return new Response(JSON.stringify({ error: msg, code: "usage_limit_reached" }), {
    status: 429,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
