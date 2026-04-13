const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://imlnfwxfswxbxmtfrarr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltbG5md3hmc3d4YnhtdGZyYXJyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDg2Mjk1NiwiZXhwIjoyMDkwNDM4OTU2fQ.VyD08G2ixdgHedLkOdSPxnFZ7QCtCL-nB6DHCGQNlIo';
const supabase = createClient(supabaseUrl, supabaseKey);

async function backfillLedger() {
  console.log("==========================================");
  console.log("   BACKFILLING LEDGER HISTORICAL DATA");
  console.log("==========================================");

  const { data: store } = await supabase.from('stores').select('id').eq('slug', 'frozenpay-foodies').single();
  if (!store) return console.error("Store not found!");

  // Empty the current ledger just in case
  await supabase.from('inventory_movements').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  const { data: products } = await supabase.from('products').select('id, name');
  const [additionsRes, adjustmentsRes, salesRes] = await Promise.all([
    supabase.from('stock_additions').select('*').eq('store_id', store.id),
    supabase.from('stock_adjustments').select('*').eq('store_id', store.id),
    supabase.from('sale_items').select('*').eq('store_id', store.id)
  ]);

  let totalInserted = 0;

  for (const product of products || []) {
    const events = [];
    
    (additionsRes.data || []).filter(a => a.product_id === product.id).forEach(a => {
      events.push({ date: new Date(a.created_at), type: 'RESTOCK', qty: Number(a.quantity_added), ref: a.id, user: a.admin_id, note: a.note, original_date: a.created_at });
    });
    
    (adjustmentsRes.data || []).filter(a => a.product_id === product.id).forEach(a => {
      const isLoss = Number(a.quantity_change) < 0;
      events.push({ date: new Date(a.created_at), type: isLoss ? 'LOSS (-)' : 'GAIN (+)', qty: Number(a.quantity_change), ref: a.id, user: a.admin_id, note: `${a.reason || ''} ${a.note || ''}`, original_date: a.created_at });
    });
    
    (salesRes.data || []).filter(s => s.product_id === product.id).forEach(s => {
      events.push({ date: new Date(s.created_at), type: 'SALE', qty: -Number(s.quantity), ref: s.id, user: null, note: 'Historical Checkout', original_date: s.created_at });
    });

    events.sort((a, b) => a.date - b.date);

    let runningBal = 0;
    const inserts = [];

    for (const ev of events) {
      const before = runningBal;
      runningBal += ev.qty;
      const after = runningBal;

      inserts.push({
        store_id: store.id,
        product_id: product.id,
        transaction_type: ev.type,
        quantity_before: before,
        quantity_change: ev.qty,
        quantity_after: after,
        actor_id: ev.user,
        reference_id: ev.ref,
        note: ev.note,
        created_at: ev.original_date
      });
    }

    if (inserts.length > 0) {
      // Chunk inserts to avoid supabase payload limits
      for (let i = 0; i < inserts.length; i += 1000) {
        const chunk = inserts.slice(i, i + 1000);
        await supabase.from('inventory_movements').insert(chunk);
      }
      totalInserted += inserts.length;
      console.log(`[${product.name}] Processed ${inserts.length} historical statements...`);
    }
  }

  console.log(`Done! Backfilled ${totalInserted} total ledgers. The UI is now perfectly readable.`);
}

backfillLedger();
