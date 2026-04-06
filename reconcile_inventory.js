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

async function reconcile() {
    console.log('Starting Inventory Reconciliation...');
    
    // 1. Fetch all products
    const { data: products, error: pError } = await supabase.from('products').select('id, name, quantity');
    if (pError) {
        console.error('Error fetching products:', pError.message);
        return;
    }

    console.log(`Reconciling ${products.length} products...`);

    for (const product of products) {
        // A. Sum Additions
        const { data: additions } = await supabase.from('stock_additions').select('quantity_added').eq('product_id', product.id);
        const totalAdded = (additions || []).reduce((acc, curr) => acc + Number(curr.quantity_added), 0);

        // B. Sum Adjustments
        const { data: adjustments } = await supabase.from('stock_adjustments').select('quantity_change').eq('product_id', product.id);
        const totalAdjusted = (adjustments || []).reduce((acc, curr) => acc + Number(curr.quantity_change), 0);

        // C. Sum Sales
        const { data: sales } = await supabase.from('sale_items').select('quantity').eq('product_id', product.id);
        const totalSold = (sales || []).reduce((acc, curr) => acc + Number(curr.quantity), 0);

        const theoreticalQty = totalAdded + totalAdjusted - totalSold;
        
        if (Math.abs(product.quantity - theoreticalQty) > 0.001) {
            console.log(`[MISMATCH] ${product.name}:`);
            console.log(`  Actual: ${product.quantity.toFixed(2)} | Theoretical: ${theoreticalQty.toFixed(2)}`);
            console.log(`  Fixing...`);
            
            const { error: updateError } = await supabase
                .from('products')
                .update({ quantity: theoreticalQty })
                .eq('id', product.id);
            
            if (updateError) {
                console.error(`  FAILED to update ${product.name}:`, updateError.message);
            } else {
                console.log(`  SUCCESS: ${product.name} reconciled.`);
            }
        } else {
            // console.log(`[OK] ${product.name}`);
        }
    }

    console.log('Reconciliation complete.');
}

reconcile();
