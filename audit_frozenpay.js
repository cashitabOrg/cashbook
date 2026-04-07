const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

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

const targetStoreId = '2d46e24a-a378-4312-a871-cc893635bf58'; // frozenpay-foodies

async function runAudit() {
  console.log('====================================================');
  console.log('   FROZENPAY FOODIES: SYSTEM AUDIT REPORT         ');
  console.log('====================================================\n');

  // 1. Sunday Audit (April 5)
  const { data: sundaySessions } = await supabase
    .from('sales_sessions')
    .select('id, total_revenue')
    .eq('store_id', targetStoreId)
    .gte('started_at', '2026-04-05T00:00:00Z')
    .lt('started_at', '2026-04-06T00:00:00Z');

  const sundayIds = (sundaySessions || []).map(s => s.id);
  const { count: sundayItemsCount } = await supabase
    .from('sale_items')
    .select('*', { count: 'exact', head: true })
    .in('session_id', sundayIds.length > 0 ? sundayIds : ['00000000-0000-0000-0000-000000000000']);

  console.log('SUNDAY (April 5, 2026):');
  console.log(`  - Sessions:       ${sundaySessions ? sundaySessions.length : 0}`);
  console.log(`  - Items Sold:     ${sundayItemsCount || 0}`);
  console.log(`  - Total Revenue:  ₦${(sundaySessions || []).reduce((acc, curr) => acc + (curr.total_revenue || 0), 0).toLocaleString()}`);
  console.log('');

  // 2. Today Audit (April 6)
  const { data: todaySessions } = await supabase
    .from('sales_sessions')
    .select('id, total_revenue')
    .eq('store_id', targetStoreId)
    .gte('started_at', '2026-04-06T00:00:00Z')
    .lt('started_at', '2026-04-07T00:00:00Z');

  const todayIds = (todaySessions || []).map(s => s.id);
  const { count: todayItemsCount } = await supabase
    .from('sale_items')
    .select('*', { count: 'exact', head: true })
    .in('session_id', todayIds.length > 0 ? todayIds : ['00000000-0000-0000-0000-000000000000']);

  console.log('TODAY (April 6, 2026):');
  console.log(`  - Sessions:       ${todaySessions ? todaySessions.length : 0}`);
  console.log(`  - Items Sold:     ${todayItemsCount || 0}`);
  console.log(`  - Total Revenue:  ₦${(todaySessions || []).reduce((acc, curr) => acc + (curr.total_revenue || 0), 0).toLocaleString()}`);
  console.log('');

  // 3. Current Inventory Audit
  console.log('CURRENT INVENTORY (Live Stock Levels):');
  const { data: products } = await supabase
    .from('products')
    .select('name, quantity, unit')
    .eq('store_id', targetStoreId)
    .order('name');

  if (products) {
    products.forEach(p => {
      console.log(`  - ${p.name.padEnd(20)}: ${p.quantity.toFixed(2)} ${p.unit || ''}`);
    });
  } else {
    console.log('  - No products found.');
  }

  console.log('\n====================================================');
}

runAudit();
