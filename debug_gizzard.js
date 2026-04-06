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

async function debugGizzard() {
    const productName = 'Gizzard';
    const { data: product } = await supabase.from('products').select('*').eq('name', productName).single();
    
    if (!product) {
        console.error('Product Gizzard not found');
        return;
    }

    console.log(`--- Debugging ${productName} (${product.id}) ---`);
    console.log(`Current Quantity in DB: ${product.quantity}`);

    const { data: additions } = await supabase.from('stock_additions').select('*').eq('product_id', product.id);
    console.log(`\nAdditions (${additions?.length || 0}):`);
    additions?.forEach(a => console.log(`  - ${a.created_at}: +${a.quantity_added} (ID: ${a.id})`));

    const { data: adjustments } = await supabase.from('stock_adjustments').select('*').eq('product_id', product.id);
    console.log(`\nAdjustments (${adjustments?.length || 0}):`);
    adjustments?.forEach(a => console.log(`  - ${a.created_at}: ${a.quantity_change > 0 ? '+' : ''}${a.quantity_change} (Reason: ${a.reason})`));

    const { data: sales } = await supabase.from('sale_items').select('*').eq('product_id', product.id);
    console.log(`\nSales (${sales?.length || 0}):`);
    const totalSold = sales?.reduce((acc, s) => acc + Number(s.quantity), 0) || 0;
    console.log(`  Total Sold: ${totalSold}`);

    console.log(`\nTheoretical Calculation:`);
    const totalAdded = additions?.reduce((acc, a) => acc + Number(a.quantity_added), 0) || 0;
    const totalAdjusted = adjustments?.reduce((acc, a) => acc + Number(a.quantity_change), 0) || 0;
    console.log(`  Sum(Added): ${totalAdded}`);
    console.log(`  Sum(Adjusted): ${totalAdjusted}`);
    console.log(`  Sum(Sold): ${totalSold}`);
    console.log(`  Result: ${totalAdded + totalAdjusted - totalSold}`);
    
    // Check for any "stock_decrement" items in offlineQueue? No, that's client side.
}

debugGizzard();
