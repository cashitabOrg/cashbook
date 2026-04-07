const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = {};
fs.readFileSync('.env.local', 'utf-8').split('\n').filter(l => l.includes('=')).map(l => l.trim()).forEach(l => {
    if (l.includes('=')) { const [k, ...v] = l.split('='); env[k.trim()] = v.join('=').trim(); }
});

const supabase = createClient(env['NEXT_PUBLIC_SUPABASE_URL'], env['SUPABASE_SERVICE_ROLE_KEY']);

async function fullCrossStoreAuditAndFix() {
    console.log('=== FULL CROSS-STORE CONTAMINATION AUDIT & FIX ===\n');

    // 1. Fetch all stores
    const { data: stores } = await supabase.from('stores').select('id, name');
    const storeMap = {};
    (stores || []).forEach(s => storeMap[s.id] = s.name);
    console.log('Stores found:', stores.map(s => `${s.name} (${s.id})`).join('\n  '));
    console.log('');

    // 2. Fetch all products with their correct store_id
    const { data: products } = await supabase.from('products').select('id, name, quantity, store_id');
    console.log(`Total products to audit: ${products.length}\n`);
    console.log('='.repeat(80));

    let totalFixedProducts = 0;
    let totalDeletedAdds = 0;
    let totalDeletedSales = 0;
    const report = [];

    for (const product of products) {
        const correctStoreId = product.store_id;
        const correctStoreName = storeMap[correctStoreId] || 'Unknown Store';

        // Fetch all additions for this product
        const { data: adds } = await supabase.from('stock_additions')
            .select('id, quantity_added, store_id, created_at')
            .eq('product_id', product.id);

        // Fetch all adjustments for this product
        const { data: adjs } = await supabase.from('stock_adjustments')
            .select('quantity_change')
            .eq('product_id', product.id);

        // Fetch all sales for this product
        const { data: sales } = await supabase.from('sale_items')
            .select('id, quantity, store_id, created_at')
            .eq('product_id', product.id);

        // Identify contaminated records
        const wrongAdds = (adds || []).filter(a => a.store_id !== correctStoreId);
        const wrongSales = (sales || []).filter(s => s.store_id !== correctStoreId);

        const hasContamination = wrongAdds.length > 0 || wrongSales.length > 0;

        if (hasContamination) {
            const wrongAddTotal = wrongAdds.reduce((a, b) => a + Number(b.quantity_added), 0);
            const wrongSaleTotal = wrongSales.reduce((a, b) => a + Number(b.quantity), 0);

            console.log(`[CONTAMINATED] ${product.name} (${correctStoreName})`);
            console.log(`  Wrong additions: ${wrongAdds.length} records = ${wrongAddTotal.toFixed(2)} kg from wrong stores`);
            wrongAdds.forEach(a => console.log(`    - ${a.created_at?.split('T')[0]} | +${a.quantity_added} | from: ${storeMap[a.store_id] || a.store_id}`));
            console.log(`  Wrong sales: ${wrongSales.length} records = ${wrongSaleTotal.toFixed(2)} kg from wrong stores`);
            wrongSales.forEach(s => console.log(`    - ${s.created_at?.split('T')[0]} | -${s.quantity} | from: ${storeMap[s.store_id] || s.store_id}`));

            // Delete wrong additions
            if (wrongAdds.length > 0) {
                const ids = wrongAdds.map(a => a.id);
                const { error: delAddErr } = await supabase.from('stock_additions').delete().in('id', ids);
                if (delAddErr) {
                    console.error(`  ERROR deleting additions: ${delAddErr.message}`);
                    continue;
                }
                totalDeletedAdds += wrongAdds.length;
                console.log(`  ✅ Deleted ${wrongAdds.length} wrong addition records`);
            }

            // Delete wrong sales
            if (wrongSales.length > 0) {
                const ids = wrongSales.map(s => s.id);
                const { error: delSaleErr } = await supabase.from('sale_items').delete().in('id', ids);
                if (delSaleErr) {
                    console.error(`  ERROR deleting sales: ${delSaleErr.message}`);
                    continue;
                }
                totalDeletedSales += wrongSales.length;
                console.log(`  ✅ Deleted ${wrongSales.length} wrong sale records`);
            }

            // Recalculate correct quantity from clean data
            const { data: cleanAdds } = await supabase.from('stock_additions').select('quantity_added').eq('product_id', product.id);
            const totalAdded = (cleanAdds || []).reduce((a, b) => a + Number(b.quantity_added), 0);
            const totalAdjs = (adjs || []).reduce((a, b) => a + Number(b.quantity_change), 0);
            const { data: cleanSales } = await supabase.from('sale_items').select('quantity').eq('product_id', product.id);
            const totalSold = (cleanSales || []).reduce((a, b) => a + Number(b.quantity), 0);
            const newQty = totalAdded + totalAdjs - totalSold;

            const { error: updateErr } = await supabase.from('products').update({ quantity: newQty }).eq('id', product.id);
            if (updateErr) {
                console.error(`  ERROR updating quantity: ${updateErr.message}`);
                continue;
            }

            console.log(`  ✅ Quantity updated: ${Number(product.quantity).toFixed(2)} → ${newQty.toFixed(2)} kg`);
            console.log(`     (Added: ${totalAdded.toFixed(2)} | Adj: ${totalAdjs.toFixed(2)} | Sold: ${totalSold.toFixed(2)})`);
            console.log('');

            totalFixedProducts++;
            report.push({
                product: product.name,
                store: correctStoreName,
                oldQty: Number(product.quantity).toFixed(2),
                newQty: newQty.toFixed(2),
                wrongAddsDeleted: wrongAdds.length,
                wrongSalesDeleted: wrongSales.length,
            });
        }
    }

    console.log('='.repeat(80));
    console.log('\n=== FINAL SUMMARY ===');
    console.log(`Products fixed:              ${totalFixedProducts}`);
    console.log(`Wrong stock additions removed: ${totalDeletedAdds}`);
    console.log(`Wrong sale records removed:    ${totalDeletedSales}`);

    if (report.length === 0) {
        console.log('\n✅ No cross-store contamination found. All products are clean.');
    } else {
        console.log('\n--- Products corrected ---');
        report.forEach(r => {
            console.log(`  [${r.store}] ${r.name}: ${r.oldQty} → ${r.newQty} kg (removed ${r.wrongAddsDeleted} adds, ${r.wrongSalesDeleted} sales)`);
        });
    }
    console.log('\nDone.');
}

fullCrossStoreAuditAndFix();
