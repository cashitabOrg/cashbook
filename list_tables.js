const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

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

const s = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function listAll() {
  const { data, error } = await s.from('stores').select('id, name');
  console.log('--- STORES ---');
  console.table(data);

  // We'll try to find any table that sounds like inventory
  const { data: products } = await s.from('products').select('*').limit(1);
  console.log('\n--- PRODUCT SCHEMA ---');
  console.log(Object.keys(products[0] || {}));

  // Note: we can't query pg_catalog directly with the standard SDK easily 
  // unless we have an RPC. But we can check if generic table names exist.
  const commonTables = ['restock_logs', 'inventory_movements', 'stock_logs', 'movements', 'inventory'];
  console.log('\n--- CHECKING COMMON TABLE NAMES ---');
  for (const t of commonTables) {
    const { error: tErr } = await s.from(t).select('id').limit(1);
    if (!tErr) console.log(`[FOUND] Table: ${t}`);
  }
}

listAll();
