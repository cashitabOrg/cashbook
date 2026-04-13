const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://imlnfwxfswxbxmtfrarr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltbG5md3hmc3d4YnhtdGZyYXJyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDg2Mjk1NiwiZXhwIjoyMDkwNDM4OTU2fQ.VyD08G2ixdgHedLkOdSPxnFZ7QCtCL-nB6DHCGQNlIo';
const supabase = createClient(supabaseUrl, supabaseKey);

async function dumpProductHistory() {
  const searchTerm = process.argv[2];
  
  if (!searchTerm) {
    console.log("Usage: node product_history.js <ProductName>");
    console.log("Example: node product_history.js Egg");
    return;
  }

  const { data: store } = await supabase.from('stores').select('id, name').eq('slug', 'frozenpay-foodies').single();
  if (!store) return console.error("Store not found!");

  // Find product by name
  const { data: product } = await supabase
    .from('products')
    .select('id, name, unit')
    .eq('store_id', store.id)
    .ilike('name', `%${searchTerm}%`)
    .single();

  if (!product) {
    console.log(`Could not find a product matching "${searchTerm}"`);
    return;
  }

  console.log("=========================================================");
  console.log(`  TRansaction Ledger For: ${product.name.toUpperCase()}`);
  console.log("=========================================================");

  // Fetch all 3 tables
  const [additionsRes, adjustmentsRes, salesRes] = await Promise.all([
    supabase.from('stock_additions').select('quantity_added, note, created_at').eq('product_id', product.id),
    supabase.from('stock_adjustments').select('quantity_change, reason, note, created_at').eq('product_id', product.id),
    supabase.from('sale_items').select('quantity, created_at').eq('product_id', product.id)
  ]);

  const events = [];

  // Map Additions
  for (const a of additionsRes.data || []) {
    events.push({
      date: new Date(a.created_at),
      type: 'RESTOCK (+)',
      qty: Number(a.quantity_added),
      details: a.note || 'General Restock'
    });
  }

  // Map Adjustments (Corrections / Resets)
  for (const a of adjustmentsRes.data || []) {
    const isLoss = Number(a.quantity_change) < 0;
    events.push({
      date: new Date(a.created_at),
      type: isLoss ? 'LOSS/CORRECTION (-)' : 'GAIN/CORRECTION (+)',
      qty: Number(a.quantity_change),
      details: `${a.reason || 'Manual Check'} - ${a.note || ''}`
    });
  }

  // Map Sales
  for (const s of salesRes.data || []) {
    events.push({
      date: new Date(s.created_at),
      type: 'SALE (-)',
      qty: -Number(s.quantity),
      details: 'Customer Sale (Checkout)'
    });
  }

  // Sort Chronologically
  events.sort((a, b) => a.date - b.date);

  let runningBalance = 0;

  // Print Header
  console.log(
    "DATE & TIME".padEnd(25) + 
    "| ACTION TYPE".padEnd(25) + 
    "| QUANTITY".padEnd(12) + 
    "| BALANCE".padEnd(12) + 
    "| DETAILS"
  );
  console.log("-".repeat(110));

  if (events.length === 0) {
     console.log("No historical records found for this item.");
  }

  // Print Body
  for (const ev of events) {
    runningBalance += ev.qty;
    
    // Format text
    const outDate = ev.date.toLocaleString('en-GB', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' }).padEnd(25);
    const outType = ev.type.padEnd(25);
    const outQty = (ev.qty > 0 ? "+" + ev.qty.toFixed(2) : ev.qty.toFixed(2)).padEnd(12);
    const outBal = runningBalance.toFixed(2).padEnd(12);
    const outDetails = ev.details.substring(0, 40);

    // Color coordination for terminal (Optional, but looks nice)
    let colorPrefix = "";
    let colorSuffix = "\x1b[0m"; // Reset
    if (ev.type.includes('+')) colorPrefix = "\x1b[32m"; // Green
    if (ev.type.includes('-')) colorPrefix = "\x1b[31m"; // Red
    if (ev.type.includes('CORRECTION')) colorPrefix = "\x1b[33m"; // Yellow

    console.log(`${outDate}| ${colorPrefix}${outType}${colorSuffix}| ${colorPrefix}${outQty}${colorSuffix}| ${outBal}| ${outDetails}`);
  }

  console.log("-".repeat(110));
  console.log(`FINAL STRICT BALANCE: ${runningBalance.toFixed(2)} ${product.unit}`);
  console.log("=========================================================\n");
}

dumpProductHistory();
