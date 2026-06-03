import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabase-admin";

const PAYSTACK_WEBHOOK_SECRET = process.env.PAYSTACK_WEBHOOK_SECRET;

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = req.headers.get("x-paystack-signature");

    if (!PAYSTACK_WEBHOOK_SECRET) {
      console.error("[Paystack Webhook] PAYSTACK_WEBHOOK_SECRET not set.");
      return NextResponse.json({ error: "Configuration error" }, { status: 500 });
    }

    // 1. Verify Signature
    const hash = crypto
      .createHmac("sha512", PAYSTACK_WEBHOOK_SECRET)
      .update(body)
      .digest("hex");

    if (hash !== signature) {
      console.warn("[Paystack Webhook] Invalid signature.");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(body);
    console.log("[Paystack Webhook] Event received:", event.event);

    // 2. Handle successful charge
    if (event.event === "charge.success") {
      const { metadata, reference, subscription, plan } = event.data;
      
      // If we don't have custom metadata (maybe standard Paystack billing dashboard subscription flow)
      // we can try to fall back or parse from custom metadata we sent
      const storeId = metadata?.storeId;
      const planId = metadata?.planId;
      const cycle = metadata?.cycle || 'monthly';

      if (!storeId || !planId) {
        console.error("[Paystack Webhook] Missing metadata in successful charge:", metadata);
        return NextResponse.json({ error: "Incomplete metadata" }, { status: 400 });
      }

      // Calculate period end
      const now = new Date();
      const periodEnd = new Date(now);
      if (cycle === 'annual') {
        periodEnd.setDate(now.getDate() + 365);
      } else {
        periodEnd.setDate(now.getDate() + 30);
      }

      const subscriptionCode = subscription?.subscription_code || plan?.plan_code || reference;

      console.log(`[Paystack Webhook] Upgrading store ${storeId} to ${planId} (${cycle}). Expiry: ${periodEnd.toISOString()}, Code: ${subscriptionCode}`);

      // Map planId ('starter' | 'growth' | 'business') to the Postgres stores.plan enum values ('free' | 'basic' | 'pro')
      let storePlanValue = 'free';
      if (planId === 'growth') storePlanValue = 'basic';
      if (planId === 'business') storePlanValue = 'pro';

      // 3. Update Database using admin client (bypassing RLS)
      const supabase = supabaseAdmin;

      // Update Store Plan cache
      const { error: storeError } = await supabase
        .from("stores")
        .update({ plan: storePlanValue })
        .eq("id", storeId);

      if (storeError) {
        console.error("[Paystack Webhook] Store plan update failed:", storeError.message);
        throw storeError;
      }

      // Update/Upsert tenant_subscriptions record
      const { error: subError } = await supabase
        .from("tenant_subscriptions")
        .upsert({
          store_id: storeId,
          plan_id: planId,
          status: "active",
          current_period_end: periodEnd.toISOString(),
          paystack_subscription_id: subscriptionCode,
          updated_at: now.toISOString()
        });

      if (subError) {
        console.error("[Paystack Webhook] Subscription upsert failed:", subError.message);
        throw subError;
      }

      console.info(`[Paystack Webhook] Successfully processed payment for store ${storeId}. Ref: ${reference}`);
    }

    return NextResponse.json({ status: "success" });
  } catch (err: any) {
    console.error("[Paystack Webhook] Internal Error:", err.message);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
