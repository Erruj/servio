import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { buildCorsHeaders } from "../_shared/security.ts";
import { getStripe, stripeMode, tierFromSubscription, PRODUCT_TIER_MAP } from "../_shared/stripe-config.ts";

const CORS_ALLOW_HEADERS = "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version";

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

const periodEndIso = (subscription: any): string | null => {
  // Vanaf 2025-08-27.basil staat current_period_end op de subscription items.
  const raw = subscription?.current_period_end ?? subscription?.items?.data?.[0]?.current_period_end ?? null;
  if (!raw) return null;
  const d = new Date(raw * 1000);
  return isNaN(d.getTime()) ? null : d.toISOString();
};

serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req, CORS_ALLOW_HEADERS);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Missing Supabase environment variables");
    }

    const supabaseClient = createClient(supabaseUrl, serviceRoleKey, { 
      auth: { persistSession: false } 
    });

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError) {
      logStep("Auth error details", { code: userError.status, message: userError.message });
      throw new Error(`Authentication error: ${userError.message}`);
    }
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Get user settings including trial info
    const { data: settings, error: settingsError } = await supabaseClient
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (settingsError && settingsError.code !== 'PGRST116') {
      throw new Error(`Settings error: ${settingsError.message}`);
    }

    // Check if trial has expired
    const trialEndDate = settings?.trial_end_date ? new Date(settings.trial_end_date) : null;
    const now = new Date();
    const trialExpired = trialEndDate ? now > trialEndDate : false;

    logStep("Trial check", { trialEndDate, trialExpired });

    // PRIMARY SOURCE: Supabase user_settings (for manually granted access, founder accounts, etc.)
    // If subscription_status is 'active' in Supabase, grant access immediately without checking Stripe.
    if (settings?.subscription_status === 'active') {
      logStep("Active subscription found in user_settings (manual/founder override)", {
        product_id: settings.subscription_product_id,
      });
      return new Response(JSON.stringify({
        subscribed: true,
        product_id: settings.subscription_product_id || 'prod_U9FG9hWuBCWWMc',
        tier: settings.subscription_tier
          || PRODUCT_TIER_MAP[settings.subscription_product_id ?? '']
          || 'pro',
        subscription_status: 'active',
        trial_end_date: trialEndDate?.toISOString() ?? null,
        subscription_end: settings.subscription_current_period_end ?? null,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Permanent free plan (no expiration). Safety: if the user still has a Stripe
    // customer on record we verify there is no active paid subscription, so a paying
    // customer can never end up locked into the free tier while being billed.
    if (settings?.subscription_status === 'free') {
      if (settings?.stripe_customer_id) {
        try {
          const stripeCheck = getStripe();
          const activeSubs = await stripeCheck.subscriptions.list({
            customer: settings.stripe_customer_id,
            status: "active",
            limit: 1,
          });
          if (activeSubs.data.length > 0) {
            const sub = activeSubs.data[0];
            const productId = sub.items.data[0].price.product as string;
            const subTier = tierFromSubscription(sub) ?? 'pro';
            const subscriptionEnd = periodEndIso(sub);
            logStep("Free flag overridden by active Stripe subscription", { subId: sub.id });
            await supabaseClient
              .from('user_settings')
              .update({
                stripe_subscription_id: sub.id,
                subscription_product_id: productId,
                subscription_tier: subTier,
                subscription_status: 'active',
                subscription_current_period_end: subscriptionEnd,
              })
              .eq('user_id', user.id);
            return new Response(JSON.stringify({
              subscribed: true,
              product_id: productId,
              tier: subTier,
              subscription_status: 'active',
              trial_end_date: trialEndDate?.toISOString() ?? null,
              subscription_end: subscriptionEnd,
            }), {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 200,
            });
          }
        } catch (e) {
          logStep("Stripe check for free plan failed", { message: String(e) });
        }
      }
      logStep("Permanent free plan selected");
      return new Response(JSON.stringify({
        subscribed: false,
        product_id: null,
        tier: 'free',
        subscription_status: 'free',
        trial_end_date: trialEndDate?.toISOString() ?? null,
        subscription_end: null,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }


    const stripe = getStripe();
    logStep("Stripe mode", { mode: stripeMode() });

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No Stripe customer found");
      
      // Return trial status if no subscription
      return new Response(JSON.stringify({ 
        subscribed: false,
        product_id: null,
        tier: trialExpired ? 'free' : 'trial',
        subscription_status: trialExpired ? 'expired' : 'trial',
        trial_end_date: trialEndDate?.toISOString(),
        subscription_end: null
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    const hasActiveSub = subscriptions.data.length > 0;
    let productId = null;
    let subscriptionEnd = null;
    let subscriptionStatus = trialExpired ? 'expired' : 'trial';
    let resolvedTier: string | null = trialExpired ? 'free' : 'trial';

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      subscriptionEnd = periodEndIso(subscription);
      productId = subscription.items.data[0].price.product as string;
      subscriptionStatus = 'active';
      resolvedTier = tierFromSubscription(subscription) ?? 'pro';
      
      logStep("Active subscription found", { 
        subscriptionId: subscription.id, 
        endDate: subscriptionEnd,
        productId 
      });

      // Update user_settings with subscription info
      await supabaseClient
        .from('user_settings')
        .update({
          stripe_customer_id: customerId,
          stripe_subscription_id: subscription.id,
          subscription_product_id: productId,
          subscription_tier: resolvedTier,
          subscription_status: 'active',
          subscription_current_period_end: subscriptionEnd,
        })
        .eq('user_id', user.id);
    } else {
      logStep("No active subscription found");
      
      // Update status if trial expired
      if (trialExpired) {
        await supabaseClient
          .from('user_settings')
          .update({ subscription_status: 'expired' })
          .eq('user_id', user.id);
      }
    }

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      product_id: productId,
      tier: resolvedTier,
      subscription_status: subscriptionStatus,
      trial_end_date: trialEndDate?.toISOString(),
      subscription_end: subscriptionEnd
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
