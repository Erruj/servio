// TIJDELIJKE testfunctie — wordt na de end-to-end Stripe-test verwijderd.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { getStripe, stripeMode } from "../_shared/stripe-config.ts";

const TEST_EMAIL = "e2e-stripe-test@getservio.co";

Deno.serve(async (req) => {
  try {
    const secret = req.headers.get("x-e2e-secret");
    if (!secret || secret !== Deno.env.get("E2E_TEST_SECRET")) {
      return new Response(JSON.stringify({ error: "forbidden" }), { status: 403 });
    }

    const url = new URL(req.url);
    const action = url.searchParams.get("action") ?? "setup";
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    if (action === "setup") {
      const password = url.searchParams.get("password")!;
      const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
      const existing = list?.users?.find((u) => u.email === TEST_EMAIL);
      let userId: string;
      if (existing) {
        userId = existing.id;
        await admin.auth.admin.updateUserById(userId, { password, email_confirm: true });
      } else {
        const { data, error } = await admin.auth.admin.createUser({
          email: TEST_EMAIL,
          password,
          email_confirm: true,
        });
        if (error) throw error;
        userId = data.user!.id;
      }
      await admin.from("user_settings").upsert(
        { user_id: userId, subscription_status: "free" },
        { onConflict: "user_id" },
      );
      const { data: settings } = await admin
        .from("user_settings")
        .select("user_id, subscription_status, subscription_tier, trial_end_date")
        .eq("user_id", userId)
        .maybeSingle();
      return Response.json({ mode: stripeMode(), userId, email: TEST_EMAIL, settings });
    }

    if (action === "status") {
      const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
      const user = list?.users?.find((u) => u.email === TEST_EMAIL);
      const { data: settings } = await admin
        .from("user_settings")
        .select(
          "user_id, subscription_status, subscription_tier, subscription_product_id, stripe_customer_id, stripe_subscription_id, subscription_current_period_end",
        )
        .eq("user_id", user!.id)
        .maybeSingle();
      const stripe = getStripe();
      const customers = await stripe.customers.list({ email: TEST_EMAIL, limit: 1 });
      const subs = customers.data.length
        ? await stripe.subscriptions.list({ customer: customers.data[0].id, limit: 5 })
        : { data: [] as any[] };
      return Response.json({
        mode: stripeMode(),
        settings,
        stripe: subs.data.map((s: any) => ({
          id: s.id,
          status: s.status,
          lookup_key: s.items?.data?.[0]?.price?.lookup_key,
          amount: s.items?.data?.[0]?.price?.unit_amount,
        })),
      });
    }

    if (action === "cancel") {
      const stripe = getStripe();
      const customers = await stripe.customers.list({ email: TEST_EMAIL, limit: 1 });
      const canceled: string[] = [];
      if (customers.data.length) {
        const subs = await stripe.subscriptions.list({ customer: customers.data[0].id, limit: 10 });
        for (const s of subs.data) {
          if (s.status !== "canceled") {
            await stripe.subscriptions.cancel(s.id);
            canceled.push(s.id);
          }
        }
      }
      return Response.json({ canceled });
    }

    if (action === "cleanup") {
      const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
      const user = list?.users?.find((u) => u.email === TEST_EMAIL);
      if (user) await admin.auth.admin.deleteUser(user.id);
      return Response.json({ deleted: !!user });
    }

    return new Response(JSON.stringify({ error: "unknown action" }), { status: 400 });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500,
    });
  }
});
