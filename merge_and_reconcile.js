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

async function mergeAndReconcile() {
    console.log('--- Starting Global Product Merge & Reconciliation ---');
    
    // 1. Fetch all products
    const { data: products, error: pError } = await supabase.from('products').select('*');
    if (pError) {
        console.error('Error fetching products:', pError.message);
        return;
    }

    // 2. Identify duplicates (case-insensitive and partial matches for common patterns)
    const canonicalMap = new Map(); // normalizedName -> canonicalProduct
    const mergeTasks = []; // { canonicalId: string, obsoleteIds: string[] }

    products.forEach(p => {
        let name = p.name.trim().toLowerCase();
        
        // Normalize common variants 
        if (name.includes('alaska')) name = 'alaska';
        if (name.includes('farm chicken')) name = 'farm chicken';
        if (name.includes('croaker')) name = 'croaker';
        if (name.includes('hake')) name = 'hake fish';
        if (name.includes('kote')) name = 'kote fish';
        if (name.includes('titus') || name.includes('alaran')) name = 'alaran (titus fish)';
        if (name === 'alaska fish') name = 'alaska';
        
        if (canonicalMap.has(name)) {
            const canonical = canonicalMap.get(name);
            // Move this one's IDs to mergeTasks
            let task = mergeTasks.find(t => t.canonicalId === canonical.id);
            if (!task) {
                task = { canonicalId: canonical.id, obsoleteIds: [] };
                mergeTasks.push(task);
            }
            task.obsoleteIds.push(p.id);
        } else {
            canonicalMap.set(name, p);
        }
    });

    console.log(`Found ${mergeTasks.length} groups to merge.`);

    for (const task of mergeTasks) {
        const canonicalProduct = products.find(p => p.id === task.canonicalId);
        console.log(`\nMerging duplicates into [${canonicalProduct.name}] (${task.canonicalId}):`);

        for (const obsId of task.obsoleteIds) {
            const obsProduct = products.find(p => p.id === obsId);
            console.log(`  <- Merging [${obsProduct.name}] (${obsId})`);

            // A. Move sale_items
            const { error: sErr } = await supabase.from('sale_items').update({ product_id: task.canonicalId }).eq('product_id', obsId);
            if (sErr) console.error(`    Error moving sales:`, sErr.message);

            // B. Move stock_additions
            const { error: aErr } = await supabase.from('stock_additions').update({ product_id: task.canonicalId }).eq('product_id', obsId);
            if (aErr) console.error(`    Error moving additions:`, aErr.message);

            // C. Move stock_adjustments
            const { error: adjErr } = await supabase.from('stock_adjustments').update({ product_id: task.canonicalId }).eq('product_id', obsId);
            if (adjErr) console.error(`    Error moving adjustments:`, adjErr.message);

            // D. Move product_price_logs
            const { error: pErr } = await supabase.from('product_price_logs').update({ product_id: task.canonicalId }).eq('product_id', obsId);
            if (pErr) console.error(`    Error moving price logs:`, pErr.message);

            // E. Delete the obsolete product
            const { error: dErr } = await supabase.from('products').delete().eq('id', obsId);
            if (dErr) console.error(`    Error deleting product record:`, dErr.message);
            else console.log(`    Deleted obsolete record.`);
        }
    }

    // 3. Final Reconciliation for ALL products
    console.log('\n--- Running Final Reconciliation for All Canonical Products ---');
    const { data: finalProducts } = await supabase.from('products').select('*');
    
    for (const product of finalProducts) {
        const { data: adds } = await supabase.from('stock_additions').select('quantity_added').eq('product_id', product.id);
        const totalAdded = (adds || []).reduce((acc, curr) => acc + Number(curr.quantity_added), 0);

        const { data: adjustments } = await supabase.from('stock_adjustments').select('quantity_change').eq('product_id', product.id);
        const totalAdjusted = (adjustments || []).reduce((acc, curr) => acc + Number(curr.quantity_change), 0);

        const { data: sales } = await supabase.from('sale_items').select('quantity').eq('product_id', product.id);
        const totalSold = (sales || []).reduce((acc, curr) => acc + Number(curr.quantity), 0);

        const theoreticalQty = totalAdded + totalAdjusted - totalSold;
        
        if (Math.abs(product.quantity - theoreticalQty) > 0.001) {
            console.log(`[FIXING] ${product.name}: ${product.quantity.toFixed(2)} -> ${theoreticalQty.toFixed(2)}`);
            await supabase.from('products').update({ quantity: theoreticalQty }).eq('id', product.id);
        }
    }

    console.log('\nGlobal Merge and Reconciliation Complete.');
}

mergeAndReconcile();
