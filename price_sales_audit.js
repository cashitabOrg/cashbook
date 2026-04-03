const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// 1. Load Environment Variables
const envLocal = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envLocal.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
        const k = parts[0].trim();
        const v = parts.slice(1).join('=').trim();
        env[k] = v;
    }
});

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = env['SUPABASE_SERVICE_ROLE_KEY'];
const supabase = createClient(supabaseUrl, supabaseKey);

async function withRetry(fn, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === retries - 1) throw err;
      console.log(`[RETRYING] ${i + 1}/${retries} due to error: ${err.message}`);
      await new Promise(r => setTimeout(r, 2000));
    }
  }
}

async function runPriceAudit() {
  const targetStoreId = '2d46e24a-a378-4312-a871-cc893635bf58'; // FrozenPay Definitive ID

  console.log('====================================================');
  console.log('   FROZEN POS: PRICE & SALES AUDIT REPORT          ');
  console.log('====================================================');
  console.log(`Target Store: FrozenPay Foodies`);
  console.log(`Audit Time: ${new Date().toLocaleString()}\n`);

  try {
    // 1. Fetch recent sessions
    const sessionRes = await withRetry(() => supabase
        .from('sales_sessions')
        .select('id, started_at, total_revenue, status')
        .eq('store_id', targetStoreId)
        .order('started_at', { ascending: false })
        .limit(5));

    const sessions = sessionRes.data;
    const sessionError = sessionRes.error;

    if (sessionError) {
      console.error('Error fetching sessions:', sessionError.message);
      return;
    }

    if (!sessions || sessions.length === 0) {
      console.log('No recent sessions found to audit.');
      return;
    }

    for (const session of sessions) {
      console.log(`----------------------------------------------------`);
      console.log(`SESSION ID: ${session.id}`);
      console.log(`Started at: ${new Date(session.started_at).toLocaleString()}`);
      console.log(`Status: ${session.status}`);
      console.log(`Reported Revenue: ₦${Number(session.total_revenue).toLocaleString()}`);
      console.log(`----------------------------------------------------`);

      // 2. Fetch items for this session
      const itemRes = await withRetry(() => supabase
        .from('sale_items')
        .select('id, quantity, product_id, products(name, price)')
        .eq('session_id', session.id));

      const items = itemRes.data;
      const itemError = itemRes.error;

      if (itemError) {
        console.error(`Error fetching items: ${itemError.message}`);
        continue;
      }

      if (!items || items.length === 0) {
          console.log('No items found in this session.');
      } else {
          console.log(`| Product Name         | Qty Sold  | Price (ea) | Expected Subtotal |`);
          console.log(`|----------------------|-----------|------------|-------------------|`);
          
          let calculatedTotal = 0;
          for (const item of items) {
              const product = item.products;
              const qty = Number(item.quantity);
              const price = Number(product.price);
              const subtotal = qty * price;
              calculatedTotal += subtotal;
              
              console.log(`| ${product.name.padEnd(20)} | ${qty.toFixed(2).padEnd(9)} | ₦${price.toLocaleString().padEnd(10)}| ₦${subtotal.toLocaleString().padEnd(16)}|`);
          }
          
          console.log(`|----------------------|-----------|------------|-------------------|`);
          console.log(`Calculated Total: ₦${calculatedTotal.toLocaleString()}`);
          console.log(`Reported Revenue: ₦${Number(session.total_revenue).toLocaleString()}`);
          
          const diff = calculatedTotal - Number(session.total_revenue);
          if (Math.abs(diff) < 0.01) {
              console.log(`Status: [MATCH] Revenue matches calculated price total.`);
          } else {
              console.log(`Status: [MISMATCH] Difference of ₦${diff.toLocaleString()} detected.`);
          }
      }
      console.log('----------------------------------------------------\n');
    }
  } catch (globalErr) {
    console.error('CRITICAL AUDIT ERROR:', globalErr.message);
  }
}

runPriceAudit();
