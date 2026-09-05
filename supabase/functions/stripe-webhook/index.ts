import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { getStripe, stripeMode, stripeWebhookSecret, tierFromSubscription } from "../_shared/stripe-config.ts";

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

// Vanaf API-versie 2025-08-27.basil staat current_period_end op de subscription
// ITEMS, niet meer op de subscription zelf. Deze helper werkt met beide vormen.
function periodEndIso(subscription: any): string | null {
  const raw =
    subscription?.current_period_end ??
    subscription?.items?.data?.[0]?.current_period_end ??
    null;
  if (!raw) return null;
  const d = new Date(raw * 1000);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

// In Basil verhuisde invoice.subscription naar invoice.parent.subscription_details.
function subscriptionIdFromInvoice(invoice: any): string | null {
  return (
    (typeof invoice?.subscription === 'string' ? invoice.subscription : null) ??
    invoice?.parent?.subscription_details?.subscription ??
    invoice?.lines?.data?.[0]?.parent?.subscription_item_details?.subscription ??
    null
  );
}

// Stripe-status → interne status. Bij past_due/unpaid houden we de toegang
// bewust actief zolang Stripe nog betaalpogingen doet; pas bij canceled of
// incomplete_expired verliest de gebruiker zijn betaalde tier.
function mapStatus(stripeStatus: string): string {
  switch (stripeStatus) {
    case 'active':
    case 'trialing':
    case 'past_due':
    case 'unpaid':
      return 'active';
    case 'canceled':
    case 'incomplete_expired':
      return 'canceled';
    default:
      return stripeStatus;
  }
}

serve(async (req) => {
  // Webhooks only come as POST
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
      },
    });
  }

  try {
    logStep("Webhook received");

    const webhookSecret = stripeWebhookSecret();
    const stripe = getStripe();
    logStep("Stripe mode", { mode: stripeMode() });

    // Get raw body and signature for verification
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      throw new Error("No stripe-signature header");
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    } catch (err) {
      logStep("Signature verification failed", { error: err instanceof Error ? err.message : String(err) });
      return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 400 });
    }

    logStep("Event verified", { type: event.type, id: event.id });

    // Initialize Supabase with service role
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Zoekt de gebruiker: eerst op stripe_customer_id, dan op e-mailadres.
    async function findUserId(customerId: string): Promise<string | null> {
      const { data: bySettings } = await supabaseClient
        .from('user_settings')
        .select('user_id')
        .eq('stripe_customer_id', customerId)
        .maybeSingle();
      if (bySettings?.user_id) return bySettings.user_id;

      const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
      if (!customer.email) {
        logStep("Customer has no email, cannot match user", { customerId });
        return null;
      }
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('id')
        .eq('email', customer.email)
        .maybeSingle();
      if (!profile) {
        logStep("No profile found for email", { email: customer.email });
        return null;
      }
      return profile.id as string;
    }

    async function syncSubscription(userId: string, customerId: string, subscription: any) {
      const productId = subscription.items?.data?.[0]?.price?.product as string | undefined;
      const status = mapStatus(subscription.status);
      const tier = tierFromSubscription(subscription);
      const { error } = await supabaseClient
        .from('user_settings')
        .update({
          stripe_customer_id: customerId,
          stripe_subscription_id: subscription.id,
          subscription_product_id: productId ?? null,
          subscription_tier: tier,
          subscription_status: status,
          subscription_current_period_end: periodEndIso(subscription),
        })
        .eq('user_id', userId);
      if (error) throw error;
      logStep("Subscription synced", { userId, status, tier, productId, stripeStatus: subscription.status });
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string | null;
        if (!subscriptionId) {
          logStep("Checkout without subscription, skipping", { sessionId: session.id });
          break;
        }
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const userId = (session.metadata?.user_id as string | undefined) ||
          (customerId ? await findUserId(customerId) : null);
        if (!userId) break;
        await syncSubscription(userId, customerId, subscription);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as any;
        const customerId = invoice.customer as string;
        const subscriptionId = subscriptionIdFromInvoice(invoice);

        if (!subscriptionId) {
          logStep("No subscription on invoice, skipping");
          break;
        }

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const userId = await findUserId(customerId);
        if (!userId) break;
        await syncSubscription(userId, customerId, subscription);
        break;
      }

      case "invoice.payment_failed": {
        // Stripe mailt de klant zelf (dashboard-instelling). Wij laten de toegang
        // staan: Stripe blijft het opnieuw proberen en stuurt bij definitief
        // falen customer.subscription.updated/deleted.
        const invoice = event.data.object as any;
        logStep("Payment failed (toegang blijft, Stripe hertest)", {
          customerId: invoice.customer,
          attempt: invoice.attempt_count,
        });
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const userId = await findUserId(customerId);
        if (!userId) break;

        await supabaseClient
          .from('user_settings')
          .update({
            subscription_status: 'canceled',
            subscription_product_id: null,
            subscription_tier: null,
            stripe_subscription_id: null,
            subscription_current_period_end: null,
          })
          .eq('user_id', userId);

        logStep("Subscription canceled", { userId });
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const userId = await findUserId(customerId);
        if (!userId) break;
        await syncSubscription(userId, customerId, subscription);
        break;
      }

      default:
        logStep("Unhandled event type", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});
