import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { PLAN_LIMITS, PlanType } from "@/lib/plans";

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

    const supabase = supabaseAdmin;

    // 2. Handle successful charge
    if (event.event === "charge.success") {
      const { metadata, reference, subscription, plan } = event.data;
      
      let storeId = metadata?.storeId;
      let planId = metadata?.planId;
      let cycle = metadata?.cycle || 'monthly';
      const subscriptionCode = subscription?.subscription_code || plan?.plan_code || reference;

      // Handle subscription renewal: if metadata is missing, but subscription code is present
      if ((!storeId || !planId) && subscription?.subscription_code) {
        console.log(`[Paystack Webhook] Renewal charge detected for subscription: ${subscription.subscription_code}`);
        
        // Fetch existing subscription record to resolve storeId and planId
        const { data: existingSub, error: lookupErr } = await supabase
          .from("tenant_subscriptions")
          .select("store_id, plan_id")
          .eq("paystack_subscription_id", subscription.subscription_code)
          .single();

        if (lookupErr || !existingSub) {
          console.error(`[Paystack Webhook] Failed to resolve store for subscription: ${subscription.subscription_code}`, lookupErr?.message);
          return NextResponse.json({ error: "Subscription resolve failed" }, { status: 400 });
        }

        storeId = existingSub.store_id;
        planId = existingSub.plan_id;

        // Determine cycle based on payment amount matches
        const planLimits = PLAN_LIMITS[planId as PlanType];
        if (planLimits) {
          const amountInNaira = event.data.amount / 100;
          if (amountInNaira === planLimits.priceAnnual) {
            cycle = 'annual';
          }
        }
      }

      if (!storeId || !planId) {
        console.error("[Paystack Webhook] Missing storeId or planId in successful charge:", metadata);
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

      console.log(`[Paystack Webhook] Upgrading/Renewing store ${storeId} to ${planId} (${cycle}). Expiry: ${periodEnd.toISOString()}, Code: ${subscriptionCode}`);

      // Map planId ('starter' | 'growth' | 'business') to the Postgres stores.plan enum values ('free' | 'basic' | 'premium')
      let storePlanValue = 'free';
      if (planId === 'starter' || planId === 'growth') storePlanValue = 'basic';
      if (planId === 'business') storePlanValue = 'premium';

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

    // 3. Handle subscription cancellations/disable
    if (event.event === "subscription.disable") {
      const { subscription_code } = event.data;
      if (subscription_code) {
        const { error: cancelError } = await supabase
          .from("tenant_subscriptions")
          .update({ status: "cancelled", updated_at: new Date().toISOString() })
          .eq("paystack_subscription_id", subscription_code);

        if (cancelError) {
          console.error(`[Paystack Webhook] Failed to cancel subscription ${subscription_code}:`, cancelError.message);
        } else {
          console.info(`[Paystack Webhook] Subscription marked cancelled: ${subscription_code}`);
        }
      }
    }

    return NextResponse.json({ status: "success" });
  } catch (err: any) {
    console.error("[Paystack Webhook] Internal Error:", err.message);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
