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

async function generateReport() {
  console.log('\n====================================================================================================');
  console.log('                      FROZEN POS: INVENTORY & SALES AUDIT REPORT                          ');
  console.log('====================================================================================================');
  console.log('Generated on: ' + new Date().toLocaleString());
  console.log('----------------------------------------------------------------------------------------------------');
  console.log('| Product Name            | Actual Stock | Total Sold | Total Added | Theoretical | Discrepancy |');
  console.log('----------------------------------------------------------------------------------------------------');

  const { data: products, error: prodError } = await supabase.from('products').select('id, name, quantity, unit');
  
  if (prodError) {
      console.error('Failed to fetch products:', prodError.message);
      return;
  }

  for (const p of products) {
    try {
        // Fetch additions
        const { data: added, error: addErr } = await supabase.from('stock_additions').select('quantity_added').eq('product_id', p.id);
        if (addErr) throw addErr;

        // Fetch sales
        const { data: sold, error: sellErr } = await supabase.from('sale_items').select('quantity').eq('product_id', p.id);
        if (sellErr) throw sellErr;
        
        const totalAdded = (added || []).reduce((acc, curr) => acc + Number(curr.quantity_added), 0);
        const totalSold = (sold || []).reduce((acc, curr) => acc + Number(curr.quantity), 0);
        const theoretical = totalAdded - totalSold;
        const actual = Number(p.quantity);
        const diff = actual - theoretical;

        // Formatting
        const name = p.name.padEnd(23).substring(0, 23);
        const act = (actual.toFixed(2) + ' ' + p.unit.substring(0, 2)).padStart(12);
        const soldQty = totalSold.toFixed(2).padStart(10);
        const addQty = totalAdded.toFixed(2).padStart(11);
        const theo = theoretical.toFixed(2).padStart(11);
        const disc = (diff > 0 ? '+' : '') + diff.toFixed(2).padStart(10);

        console.log(`| ${name} | ${act} | ${soldQty} | ${addQty} | ${theo} | ${disc} |`);
    } catch (e) {
        console.log(`| ${p.name.padEnd(23).substring(0, 23)} | ERROR: ${e.message.padEnd(58)} |`);
    }
  }
  console.log('----------------------------------------------------------------------------------------------------');
  console.log('Note: "Discrepancy" = (Actual Stock - Theoretical Stock). ');
  console.log('A negative value means stock was deducted more than once or sales records are missing.');
  console.log('====================================================================================================\n');
}

generateReport();
