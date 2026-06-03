import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    // Optional basic security check (e.g. CRON_SECRET)
    // if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    const now = new Date();
    // Expiry in exactly 3 days (allow a 24 hour window between 2.5 days and 3.5 days from now)
    const minExpiry = new Date(now.getTime() + 2.5 * 24 * 60 * 60 * 1000);
    const maxExpiry = new Date(now.getTime() + 3.5 * 24 * 60 * 60 * 1000);

    console.log(`[Cron Reminders] Checking active subscriptions expiring between ${minExpiry.toISOString()} and ${maxExpiry.toISOString()}`);

    // Query active subscriptions expiring within the 3-day target window
    const { data: subs, error: subError } = await supabaseAdmin
      .from("tenant_subscriptions")
      .select("store_id, current_period_end, plan_id")
      .eq("status", "active")
      .gte("current_period_end", minExpiry.toISOString())
      .lte("current_period_end", maxExpiry.toISOString());

    if (subError) {
      console.error("[Cron Reminders] Error fetching expiring subscriptions:", subError.message);
      return NextResponse.json({ error: subError.message }, { status: 500 });
    }

    const remindersSent: any[] = [];

    if (subs && subs.length > 0) {
      for (const sub of subs) {
        // Fetch the store details
        const { data: store } = await supabaseAdmin
          .from("stores")
          .select("name")
          .eq("id", sub.store_id)
          .single();

        // Fetch the store owners (admin role) for this store
        const { data: owners } = await supabaseAdmin
          .from("users")
          .select("email, full_name")
          .eq("store_id", sub.store_id)
          .eq("role", "admin");

        if (owners && owners.length > 0) {
          for (const owner of owners) {
            // Simulate sending email
            const logMsg = `[Cron Reminder] Email sent to ${owner.full_name} (${owner.email}) for store "${store?.name || 'Unknown'}" (${sub.store_id}). Plan "${sub.plan_id.toUpperCase()}" expires on ${new Date(sub.current_period_end).toLocaleDateString()}.`;
            console.log(logMsg);
            
            // Insert into a mock audit log or notification table if required
            await supabaseAdmin.from("inventory_movements").insert({
              store_id: sub.store_id,
              transaction_type: "SYSTEM_NOTIFICATION",
              quantity_before: 0,
              quantity_change: 0,
              quantity_after: 0,
              note: `Subscription renewal reminder email scheduled/sent to owner: ${owner.email}`
            });

            remindersSent.push({
              storeId: sub.store_id,
              storeName: store?.name,
              ownerEmail: owner.email,
              plan: sub.plan_id,
              expiry: sub.current_period_end
            });
          }
        }
      }
    }

    return NextResponse.json({
      status: "success",
      checkedAt: now.toISOString(),
      remindersSentCount: remindersSent.length,
      remindersSent
    });

  } catch (err: any) {
    console.error("[Cron Reminders] System error:", err.message);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
