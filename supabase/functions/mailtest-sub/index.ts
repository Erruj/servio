// TIJDELIJKE testfunctie voor de abonnement-bedankmail. Wordt na de test verwijderd.
import { timingSafeEqual } from "../_shared/security.ts";
import { getStripe, resolvePriceId, stripeMode } from "../_shared/stripe-config.ts";

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  const secret = Deno.env.get("MAILTEST_SECRET") ?? "";
  const given = req.headers.get("x-mailtest-secret") ?? "";
  if (!secret || !timingSafeEqual(given, secret)) return json({ error: "unauthorized" }, 401);

  const url = new URL(req.url);
  const action = url.searchParams.get("action") ?? "send";
  const to = url.searchParams.get("to") ?? "info@getservio.co";

  if (action === "send") {
    const results: Record<string, unknown> = {};
    const cases: Array<[string, string, number, string]> = [
      ["starter", "month", 999, "2026-10-05T17:27:12Z"],
      ["pro", "month", 2999, "2026-10-05T17:27:12Z"],
      ["business", "year", 79999, "2027-09-05T17:27:12Z"],
    ];
    for (const [tier, interval, amount, periodEnd] of cases) {
      const res = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-subscription-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        },
        body: JSON.stringify({ to, tier, amount_cents: amount, interval, period_end: periodEnd }),
      });
      results[tier] = { status: res.status, body: await res.text() };
    }
    return json({ to, results });
  }

  if (action === "stripe") {
    // Maakt in TEST mode een echt abonnement aan → triggert de webhook.
    const tier = (url.searchParams.get("tier") ?? "pro") as "starter" | "pro" | "business";
    const cycle = url.searchParams.get("cycle") === "yearly" ? "yearly" : "monthly";
    const stripe = getStripe();
    if (stripeMode() !== "test") return json({ error: "alleen in test mode" }, 400);
    const priceId = await resolvePriceId(stripe, tier, cycle);
    const customer = await stripe.customers.create({ email: to, payment_method: "pm_card_visa", invoice_settings: { default_payment_method: "pm_card_visa" } });
    const sub = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: priceId }],
    });
    return json({ customer: customer.id, subscription: sub.id, status: sub.status, priceId, tier, cycle });
  }

  if (action === "cleanup") {
    const stripe = getStripe();
    const customers = await stripe.customers.list({ email: to, limit: 20 });
    const removed: string[] = [];
    for (const c of customers.data) {
      const subs = await stripe.subscriptions.list({ customer: c.id, limit: 10 });
      for (const s of subs.data) {
        if (s.status !== "canceled") await stripe.subscriptions.cancel(s.id);
      }
      removed.push(c.id);
    }
    return json({ canceledFor: removed });
  }

  return json({ error: "onbekende actie" }, 400);
});
