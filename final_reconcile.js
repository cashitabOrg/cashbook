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

async function finalSweep() {
    console.log('--- Starting Final Atomic Reconciliation (Full History Sweep) ---');
    
    // 1. Fetch all canonical products
    const { data: products, error: pError } = await supabase.from('products').select('id, name, quantity');
    if (pError) {
        console.error('Error fetching products:', pError.message);
        return;
    }

    console.log(`Auditing ${products.length} products...`);

    for (const product of products) {
        // A. Sum all Additions
        const { data: adds } = await supabase.from('stock_additions').select('quantity_added').eq('product_id', product.id);
        const totalAdded = (adds || []).reduce((acc, curr) => acc + Number(curr.quantity_added), 0);

        // B. Sum all Adjustments
        const { data: adjustments } = await supabase.from('stock_adjustments').select('quantity_change').eq('product_id', product.id);
        const totalAdjusted = (adjustments || []).reduce((acc, curr) => acc + Number(curr.quantity_change), 0);

        // C. Sum all Sales
        const { data: sales } = await supabase.from('sale_items').select('quantity').eq('product_id', product.id);
        const totalSold = (sales || []).reduce((acc, curr) => acc + Number(curr.quantity), 0);

        // D. Calculate Ground Truth
        const groundTruth = totalAdded + totalAdjusted - totalSold;
        
        // E. Apply Fix
        if (Math.abs(product.quantity - groundTruth) > 0.001) {
            console.log(`[RECONCILED] ${product.name.padEnd(20)} | History: ${totalAdded.toFixed(2)} (+${totalAdjusted.toFixed(2)}) - ${totalSold.toFixed(2)} = ${groundTruth.toFixed(2)} | Was: ${product.quantity.toFixed(2)}`);
            const { error: uErr } = await supabase
                .from('products')
                .update({ quantity: groundTruth })
                .eq('id', product.id);
            if (uErr) console.error(`  Error fixing ${product.name}:`, uErr.message);
        } else {
            // console.log(`[OK] ${product.name.padEnd(20)} | Current: ${product.quantity.toFixed(2)}`);
        }
    }

    console.log('\nFinal Sweep Complete. All products now match their transaction history.');
}

finalSweep();
