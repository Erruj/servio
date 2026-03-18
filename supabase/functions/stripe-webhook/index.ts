import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

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

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!stripeKey || !webhookSecret) {
      throw new Error("Missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

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
      logStep("Signature verification failed", { error: err.message });
      return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 400 });
    }

    logStep("Event verified", { type: event.type, id: event.id });

    // Initialize Supabase with service role
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    switch (event.type) {
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        const subscriptionId = invoice.subscription as string;

        if (!subscriptionId) {
          logStep("No subscription on invoice, skipping");
          break;
        }

        // Get the full subscription to find product info
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const productId = subscription.items.data[0]?.price?.product as string;
        const periodEnd = new Date(subscription.current_period_end * 1000).toISOString();

        logStep("Payment succeeded", { customerId, subscriptionId, productId, periodEnd });

        // Find user by Stripe customer email
        const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
        if (!customer.email) {
          logStep("Customer has no email, cannot match user");
          break;
        }

        // Look up user by email in profiles
        const { data: profile, error: profileError } = await supabaseClient
          .from('profiles')
          .select('id')
          .eq('email', customer.email)
          .single();

        if (profileError || !profile) {
          logStep("No profile found for email", { email: customer.email, error: profileError?.message });
          break;
        }

        logStep("Found user", { userId: profile.id });

        // Update user_settings with subscription info
        const { error: updateError } = await supabaseClient
          .from('user_settings')
          .update({
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            subscription_product_id: productId,
            subscription_status: 'active',
            subscription_current_period_end: periodEnd,
          })
          .eq('user_id', profile.id);

        if (updateError) {
          logStep("Failed to update user_settings", { error: updateError.message });
          throw updateError;
        }

        logStep("User subscription updated successfully", { userId: profile.id, productId });
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
        if (!customer.email) break;

        const { data: profile } = await supabaseClient
          .from('profiles')
          .select('id')
          .eq('email', customer.email)
          .single();

        if (!profile) break;

        await supabaseClient
          .from('user_settings')
          .update({
            subscription_status: 'canceled',
            subscription_product_id: null,
            stripe_subscription_id: null,
            subscription_current_period_end: null,
          })
          .eq('user_id', profile.id);

        logStep("Subscription canceled", { userId: profile.id });
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const productId = subscription.items.data[0]?.price?.product as string;
        const periodEnd = new Date(subscription.current_period_end * 1000).toISOString();
        const status = subscription.status === 'active' ? 'active' : subscription.status;

        const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
        if (!customer.email) break;

        const { data: profile } = await supabaseClient
          .from('profiles')
          .select('id')
          .eq('email', customer.email)
          .single();

        if (!profile) break;

        await supabaseClient
          .from('user_settings')
          .update({
            stripe_customer_id: customerId,
            stripe_subscription_id: subscription.id,
            subscription_product_id: productId,
            subscription_status: status,
            subscription_current_period_end: periodEnd,
          })
          .eq('user_id', profile.id);

        logStep("Subscription updated", { userId: profile.id, status, productId });
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
