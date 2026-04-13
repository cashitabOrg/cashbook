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

    // 2. Handle relevant events
    if (event.event === "charge.success") {
      const { metadata, reference } = event.data;
      const { storeId, planId, cycle } = metadata;

      if (!storeId || !planId) {
        console.error("[Paystack Webhook] Missing metadata in successful charge.");
        return NextResponse.json({ error: "Incomplete metadata" }, { status: 400 });
      }

      // Calculate new period end
      const now = new Date();
      const periodEnd = new Date(now);
      if (cycle === 'annual') {
        periodEnd.setFullYear(now.getFullYear() + 1);
      } else {
        periodEnd.setDate(now.getDate() + 30);
      }

      console.log(`[Paystack Webhook] Upgrading store ${storeId} to ${planId} (${cycle}). New end: ${periodEnd.toISOString()}`);

      // 3. Update Database using admin client (Service Role)
      const supabase = supabaseAdmin;

      // Update Store Plan
      const { error: storeError } = await supabase
        .from("stores")
        .update({ plan: planId })
        .eq("id", storeId);

      if (storeError) {
        console.error("[Paystack Webhook] Store update failed:", storeError.message);
        throw storeError;
      }

      // Update or Upsert Subscription Metadata
      const { error: subError } = await supabase
        .from("tenant_subscriptions")
        .upsert({
          store_id: storeId,
          plan_id: planId,
          status: "active",
          current_period_end: periodEnd.toISOString(),
          updated_at: now.toISOString()
        });

      if (subError) {
        console.error("[Paystack Webhook] Subscription update failed:", subError.message);
        throw subError;
      }

      // Log success (You could also insert into a payment_logs table here)
      console.info(`[Paystack Webhook] Successfully processed payment for store ${storeId}. Ref: ${reference}`);
    }

    return NextResponse.json({ status: "success" });
  } catch (err: any) {
    console.error("[Paystack Webhook] Internal Error:", err.message);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
