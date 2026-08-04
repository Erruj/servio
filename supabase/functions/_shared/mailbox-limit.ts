// Server-side afdwinging van het maximum aantal gekoppelde mailboxen per abonnement.
// Gespiegeld aan src/hooks/subscriptionTiers.ts (SUBSCRIPTION_TIERS) en
// src/hooks/useFeatureAccess.ts (limits.maxMailboxes).

// deno-lint-ignore no-explicit-any
type Admin = any;

const MAILBOX_LIMITS: Record<string, number | null> = {
  free: 1,
  starter: 2,
  pro: 5,
  business: null, // onbeperkt
};

const PRODUCT_TIER_MAP: Record<string, string> = {
  prod_TUHktvw98PDTTn: "starter",
  prod_U9FG9hWuBCWWMc: "pro",
  prod_TUHl8Gz4fh6OIL: "business",
  // legacy product-ID's (backward compatibility)
  prod_TUHkdkFCR6tlSm: "pro",
};

function tierFromProductId(productId?: string | null): string {
  return productId ? (PRODUCT_TIER_MAP[productId] || "free") : "free";
}

export interface MailboxLimitResult {
  allowed: boolean;
  limit: number | null;
  tier: string;
  current: number;
}

/**
 * Controleert of de gebruiker nog een NIEUWE mailbox mag koppelen.
 * Het opnieuw koppelen van een bestaande mailbox (zelfde provider + e-mailadres)
 * is altijd toegestaan, ook boven de limiet.
 */
export async function checkMailboxLimit(
  admin: Admin,
  userId: string,
  provider: string,
  emailAddress: string,
): Promise<MailboxLimitResult> {
  const { data: settings } = await admin
    .from("user_settings")
    .select("subscription_status, subscription_product_id")
    .eq("user_id", userId)
    .maybeSingle();

  const tier = settings?.subscription_status === "active"
    ? tierFromProductId(settings.subscription_product_id)
    : settings?.subscription_status === "trial"
      ? "pro"
      : "free";

  const limit = MAILBOX_LIMITS[tier] ?? null;
  if (limit === null) return { allowed: true, limit: null, tier, current: 0 };

  const { data: existing } = await admin
    .from("email_connections")
    .select("id, provider, email_address, is_active")
    .eq("user_id", userId)
    .eq("is_active", true);

  const rows = (existing || []) as Array<{ provider: string; email_address: string }>;
  const alreadyLinked = rows.some(
    (r) =>
      r.provider === provider &&
      (r.email_address || "").toLowerCase() === (emailAddress || "").toLowerCase(),
  );

  if (alreadyLinked) return { allowed: true, limit, tier, current: rows.length };

  return { allowed: rows.length < limit, limit, tier, current: rows.length };
}
