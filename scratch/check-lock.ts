const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://imlnfwxfswxbxmtfrarr.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltbG5md3hmc3d4YnhtdGZyYXJyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDg2Mjk1NiwiZXhwIjoyMDkwNDM4OTU2fQ.VyD08G2ixdgHedLkOdSPxnFZ7QCtCL-nB6DHCGQNlIo";

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function checkFrozenPay() {
  try {
    console.log("Checking frozenpay foodies...");
    
    // 1. Find store
    const { data: stores } = await supabaseAdmin.from("stores").select("id, name").ilike("name", "%frozenpay%");
    if (!stores?.[0]) return console.error("Store not found");

    const store = stores[0];
    console.log(`Found store: ${store.name}`);

    // 2. Find any approved session with items
    const { data: sessions } = await supabaseAdmin
      .from("sales_sessions")
      .select("id, started_at, approval_status")
      .eq("store_id", store.id)
      .eq("approval_status", "approved")
      .limit(1);

    if (!sessions?.[0]) return console.log("No approved sessions found.");

    const session = sessions[0];
    const { data: items } = await supabaseAdmin
      .from("sale_items")
      .select("id")
      .eq("session_id", session.id)
      .limit(1);

    if (!items?.[0]) return console.log(`Session ${session.id} has no items to test.`);

    const item = items[0];
    console.log(`Testing lock on sale_item ${item.id} (Session: ${session.id}, Status: ${session.approval_status})`);

    // 3. TRY TO DELETE IT
    console.log("ATTEMPTING DELETE (Should fail)...");
    const { error: delErr } = await supabaseAdmin
      .from("sale_items")
      .delete()
      .eq("id", item.id);

    if (delErr) {
      console.log(`✅ LOCK VERIFIED: Delete rejected. Error: ${delErr.message}`);
    } else {
      console.log("❌ LOCK FAILED: Record was deleted from the database!");
    }

    // 4. TRY TO UPDATE IT
    console.log("ATTEMPTING UPDATE (Should fail)...");
    const { error: updateErr } = await supabaseAdmin
      .from("sale_items")
      .update({ quantity: 99 })
      .eq("id", item.id);

    if (updateErr) {
      console.log(`✅ LOCK VERIFIED: Update rejected. Error: ${updateErr.message}`);
    } else {
      console.log("❌ LOCK FAILED: Record was updated in the database!");
    }

  } catch (e) {
    console.error("Runtime error:", e);
  }
}

checkFrozenPay();
