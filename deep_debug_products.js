const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const envLocal = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envLocal.split('\n').map(line => line.trim()).filter(line => line && !line.startsWith('#')).forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
        const k = parts[0].trim();
        const v = parts.slice(1).join('=').trim();
        env[k] = v;
    }
});

const supabase = createClient(env['NEXT_PUBLIC_SUPABASE_URL'], env['SUPABASE_SERVICE_ROLE_KEY']);

async function debugProducts() {
    console.log('--- Deep Audit of Specific Discrepancies ---');
    const productsToCheck = ['Gizzard', 'Farm Chicken', 'Croaker'];
    
    const { data: dbProducts } = await supabase.from('products').select('*').in('name', productsToCheck);
    
    if (!dbProducts) return;

    for (const p of dbProducts) {
        console.log(`\nProduct: ${p.name} (${p.id})`);
        console.log(`  Current Qty in DB: ${p.quantity}`);

        const { data: adds } = await supabase.from('stock_additions').select('*').eq('product_id', p.id);
        const totalAdded = (adds || []).reduce((acc, a) => acc + Number(a.quantity_added), 0);
        console.log(`  Total Added in Logs: ${totalAdded}`);
        (adds || []).forEach(a => console.log(`    - ${a.created_at}: +${a.quantity_added}`));

        const { data: sales } = await supabase.from('sale_items').select('*').eq('product_id', p.id);
        const totalSold = (sales || []).reduce((acc, s) => acc + Number(s.quantity), 0);
        console.log(`  Total Sold in Logs: ${totalSold}`);

        console.log(`  Theoretical (Added - Sold): ${totalAdded - totalSold}`);
    }

    // LIST ALL TRIGGERS ON ALL TABLES
    console.log('\n--- Active Triggers ---');
    const { data: triggers, error: tError } = await supabase.rpc('exec_sql', { sql_query: "select event_object_table, trigger_name, action_timing, event_manipulation from information_schema.triggers where trigger_schema = 'public'" });
    if (tError) console.error('Error fetching triggers:', tError.message);
    else console.log(JSON.stringify(triggers, null, 2));
}

debugProducts();
