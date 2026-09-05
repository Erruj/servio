// Centrale Stripe-configuratie: schakelt tussen TEST- en LIVE-mode.
//
// Secrets:
//   STRIPE_MODE              "test" of "live" (afwezig = live)
//   STRIPE_SECRET_KEY        live secret/restricted key (bestaand, beheerd)
//   STRIPE_SECRET_KEY_TEST   test secret key (sk_test_... / rk_test_...)
//   STRIPE_WEBHOOK_SECRET    webhook signing secret voor live
//   STRIPE_WEBHOOK_SECRET_TEST  webhook signing secret voor test
//
// In TEST-mode worden producten en prijzen automatisch aangemaakt op basis van
// lookup keys (servio_<tier>_<cycle>), dus de gebruiker hoeft in Stripe test mode
// niets handmatig opnieuw aan te maken.

import Stripe from "https://esm.sh/stripe@18.5.0";

export const STRIPE_API_VERSION = "2025-08-27.basil" as const;

export type StripeMode = "test" | "live";
export type Tier = "starter" | "pro" | "business";
export type BillingCycle = "monthly" | "yearly";

export function stripeMode(): StripeMode {
  return (Deno.env.get("STRIPE_MODE") || "").trim().toLowerCase() === "test" ? "test" : "live";
}

export function stripeSecretKey(): string {
  const mode = stripeMode();
  const key = mode === "test"
    ? (Deno.env.get("STRIPE_SECRET_KEY_TEST") || Deno.env.get("STRIPE_TEST_API_KEY"))
    : (Deno.env.get("STRIPE_SECRET_KEY_LIVE") || Deno.env.get("STRIPE_SECRET_KEY"));
  if (!key) {
    throw new Error(
      mode === "test"
        ? "STRIPE_SECRET_KEY_TEST ontbreekt terwijl STRIPE_MODE=test is ingesteld"
        : "STRIPE_SECRET_KEY ontbreekt",
    );
  }
  if (mode === "test" && !/_test_/.test(key)) {
    throw new Error("STRIPE_SECRET_KEY_TEST is geen test-key (verwacht sk_test_... of rk_test_...)");
  }
  if (mode === "live" && /_test_/.test(key)) {
    throw new Error("STRIPE_SECRET_KEY is een test-key terwijl STRIPE_MODE op live staat");
  }
  return key;
}

export function stripeWebhookSecret(): string {
  const mode = stripeMode();
  const secret = mode === "test"
    ? Deno.env.get("STRIPE_WEBHOOK_SECRET_TEST")
    : (Deno.env.get("STRIPE_WEBHOOK_SECRET_LIVE") || Deno.env.get("STRIPE_WEBHOOK_SECRET"));
  if (!secret) {
    throw new Error(
      mode === "test"
        ? "STRIPE_WEBHOOK_SECRET_TEST ontbreekt terwijl STRIPE_MODE=test is ingesteld"
        : "STRIPE_WEBHOOK_SECRET ontbreekt",
    );
  }
  return secret;
}

export function getStripe(): Stripe {
  return new Stripe(stripeSecretKey(), { apiVersion: STRIPE_API_VERSION });
}

// ---------------------------------------------------------------------------
// Prijzen
// ---------------------------------------------------------------------------

// LIVE prijs-ID's (Stripe live mode). Gespiegeld in src/hooks/subscriptionTiers.ts.
const LIVE_PRICE_IDS: Record<BillingCycle, Record<Tier, string>> = {
  monthly: {
    starter: "price_1TAwkPDME8sDkzM9evpM3A6l",
    pro: "price_1TAwm4DME8sDkzM9EHWmKOfm",
    business: "price_1TAwnFDME8sDkzM9TdEvv5zC",
  },
  yearly: {
    starter: "price_1Td9yCDME8sDkzM9SMtJR6aP",
    pro: "price_1TdA0ZDME8sDkzM9ePwqBEIG",
    business: "price_1TdA1TDME8sDkzM9f24n5ANg",
  },
};

// Bedragen in centen — gebruikt om test-mode prijzen automatisch aan te maken.
const PLAN_AMOUNTS: Record<Tier, { name: string; monthly: number; yearly: number }> = {
  starter: { name: "Servio Starter", monthly: 999, yearly: 9999 },
  pro: { name: "Servio Pro", monthly: 2999, yearly: 29999 },
  business: { name: "Servio Business", monthly: 7999, yearly: 79999 },
};

export function lookupKey(tier: Tier, cycle: BillingCycle): string {
  return `servio_${tier}_${cycle}`;
}

/**
 * Geeft het prijs-ID voor een tier + cyclus in de actieve mode.
 * In test mode wordt de prijs opgezocht via lookup key en zo nodig aangemaakt.
 */
export async function resolvePriceId(
  stripe: Stripe,
  tier: Tier,
  cycle: BillingCycle,
): Promise<string> {
  if (stripeMode() === "live") {
    const id = LIVE_PRICE_IDS[cycle][tier];
    if (!id) throw new Error(`Geen live prijs-ID voor ${tier} (${cycle})`);
    return id;
  }

  const key = lookupKey(tier, cycle);
  const existing = await stripe.prices.list({ lookup_keys: [key], active: true, limit: 1 });
  if (existing.data.length > 0) return existing.data[0].id;

  // Product zoeken op metadata, anders aanmaken.
  const plan = PLAN_AMOUNTS[tier];
  const search = await stripe.products.search({ query: `metadata['servio_tier']:'${tier}'`, limit: 1 });
  const product = search.data[0] ?? await stripe.products.create({
    name: plan.name,
    description: `Servio ${tier} abonnement (test mode)`,
    metadata: { servio_tier: tier },
  });

  const price = await stripe.prices.create({
    product: product.id,
    currency: "eur",
    unit_amount: cycle === "yearly" ? plan.yearly : plan.monthly,
    recurring: { interval: cycle === "yearly" ? "year" : "month" },
    lookup_key: key,
    metadata: { servio_tier: tier, servio_cycle: cycle },
  });
  return price.id;
}

// ---------------------------------------------------------------------------
// Tier-herkenning
// ---------------------------------------------------------------------------

// Bekende product-ID's (live + legacy). Test-mode producten worden herkend via
// price.lookup_key / metadata, niet via deze lijst.
export const PRODUCT_TIER_MAP: Record<string, Tier> = {
  prod_U9FEn3lMyxZ6xR: "starter",
  prod_U9FG9hWuBCWWMc: "pro",
  prod_U9FHgm6gn3Iq50: "business",
  prod_TUHktvw98PDTTn: "starter",
  prod_TUHkdkFCR6tlSm: "pro",
  prod_TUHl8Gz4fh6OIL: "business",
};

/** Leidt het tier af uit een subscription-item (werkt in test én live mode). */
export function tierFromSubscription(subscription: any): Tier | null {
  const price = subscription?.items?.data?.[0]?.price;
  if (!price) return null;

  const fromLookup = typeof price.lookup_key === "string"
    ? price.lookup_key.match(/^servio_(starter|pro|business)_/)?.[1]
    : null;
  if (fromLookup) return fromLookup as Tier;

  const fromMeta = price.metadata?.servio_tier ?? (typeof price.product === "object" ? price.product?.metadata?.servio_tier : null);
  if (fromMeta && ["starter", "pro", "business"].includes(fromMeta)) return fromMeta as Tier;

  const productId = typeof price.product === "string" ? price.product : price.product?.id;
  if (productId && PRODUCT_TIER_MAP[productId]) return PRODUCT_TIER_MAP[productId];

  // Laatste redmiddel: op bedrag matchen.
  const amount = price.unit_amount ?? 0;
  for (const [tier, plan] of Object.entries(PLAN_AMOUNTS)) {
    if (amount === plan.monthly || amount === plan.yearly) return tier as Tier;
  }
  return null;
}
