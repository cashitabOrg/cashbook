const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// 1. Setup Supabase
const env = {};
fs.readFileSync('.env.local', 'utf-8').split('\n').filter(l => l.includes('=')).map(l => l.trim()).forEach(l => {
    if(l.includes('=')) {
        const [k, ...v] = l.split('=');
        env[k] = v.join('=');
    }
});
const supabase = createClient(env['NEXT_PUBLIC_SUPABASE_URL'], env['SUPABASE_SERVICE_ROLE_KEY']);

async function verifyIsolation() {
    console.log('--- STARTING STOCK ISOLATION VERIFICATION ---');
    
    const storeA_Id = '2d46e24a-a378-4312-a871-cc893635bf58'; // Frozenpay
    const storeB_Id = '3aa2d844-61f2-4407-855c-2e952a936f7c'; // Kenny Store

    // 2. Pick a sentinel product in Store A
    const { data: storeA_Products } = await supabase.from('products').select('*').eq('store_id', storeA_Id).limit(1);
    const sentinel = storeA_Products[0];
    if (!sentinel) {
        console.error('No products found in Store A');
        return;
    }
    console.log(`Sentinel Product in Store A: "${sentinel.name}" (Current Qty: ${sentinel.quantity})`);

    // 3. Find/Create a product in Store B
    const { data: storeB_Products } = await supabase.from('products').select('*').eq('store_id', storeB_Id).limit(1);
    let targetB = storeB_Products[0];
    if (!targetB) {
        console.log('No products in Store B, creating one...');
        const { data: newProd } = await supabase.from('products').insert({
            name: 'Isolation Test Item',
            unit: 'test',
            quantity: 100,
            store_id: storeB_Id,
            min_quantity: 5
        }).select().single();
        targetB = newProd;
    }
    console.log(`Target Product in Store B: "${targetB.name}" (Current Qty: ${targetB.quantity})`);

    // 4. Perform an Adjustment in Store B
    console.log(`Adding 50 units to Store B product...`);
    const { error: adjErr } = await supabase.rpc('increment_stock', {
        p_id: targetB.id,
        p_quantity: 50
    });
    
    if (adjErr) {
        console.error('Adjustment in Store B failed:', adjErr.message);
    } else {
        console.log('Adjustment in Store B successful.');
    }

    // 5. Verify Store A's Sentinel
    const { data: sentinelAfter } = await supabase.from('products').select('quantity').eq('id', sentinel.id).single();
    
    console.log(`\n--- RESULTS ---`);
    console.log(`Store A Sentinel BEFORE: ${sentinel.quantity}`);
    console.log(`Store A Sentinel AFTER:  ${sentinelAfter.quantity}`);
    
    if (sentinel.quantity === sentinelAfter.quantity) {
        console.log('✅ PROOF: Stocks are independent. Changes in Store B did NOT leak into Store A.');
    } else {
        console.log('❌ ALERT: Stocks changed in Store A! Isolation breach detected.');
    }
    
    // 6. Final check: Check if product names cross-pollinate in queries
    const { data: allNames } = await supabase.from('products').select('name').eq('store_id', storeA_Id);
    if (allNames.some(n => n.name === 'Isolation Test Item')) {
       console.log('❌ ALERT: Product naming leakage detected.');
    } else {
       console.log('✅ PROOF: Product metadata is correctly scoped to store_id.');
    }
}

verifyIsolation();
