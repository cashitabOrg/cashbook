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

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = env['SUPABASE_SERVICE_ROLE_KEY'];

const supabase = createClient(supabaseUrl, supabaseKey);

async function deepAuditSales() {
    const storeSlug = 'frozenpay-foodies';
    const { data: store } = await supabase.from('stores').select('id, name').eq('slug', storeSlug).single();
    
    if (!store) {
        console.error('Store not found');
        return;
    }

    console.log(`Deep audit for store: ${store.name} (${store.id})`);

    // Sunday, April 5th, 2026 (UTC)
    // To be safe, we check Saturday 10 PM to Monday 2 AM UTC to cover WAT Sunday
    const start = '2026-04-04T22:00:00Z'; // Sunday 00:00 WAT
    const end = '2026-04-05T23:59:59Z';   // Sunday 23:59 WAT (approx)

    // 1. Count Total Sale Items for the Store on Sunday
    const { count: totalItems, error: itemsError } = await supabase
        .from('sale_items')
        .select('*', { count: 'exact', head: true })
        .eq('store_id', store.id)
        .gte('created_at', start)
        .lte('created_at', end);

    if (itemsError) {
        console.error('Error counting items:', itemsError.message);
    } else {
        console.log(`Total sale items (transactions) on Sunday: ${totalItems}`);
    }

    // 2. Breakdown by session
    const { data: sessions, error: sesError } = await supabase
        .from('sales_sessions')
        .select('id, status, started_at, ended_at, manager_id')
        .eq('store_id', store.id)
        .gte('started_at', start)
        .lte('started_at', end);

    if (sessions) {
        console.log(`Sessions found: ${sessions.length}`);
        for (const s of sessions) {
            const { count: sCount } = await supabase
                .from('sale_items')
                .select('*', { count: 'exact', head: true })
                .eq('session_id', s.id);
            console.log(`- Session ${s.id} (Status: ${s.status}): ${sCount} items`);
        }
    }

    // 3. Are there any items belonging to sessions NOT started on Sunday but created on Sunday?
    const { data: oddItems } = await supabase
        .from('sale_items')
        .select('session_id, id')
        .eq('store_id', store.id)
        .gte('created_at', start)
        .lte('created_at', end);
    
    const sessionIdsFromItems = [...new Set(oddItems?.map(i => i.session_id) || [])];
    const SundaySessionIds = sessions?.map(s => s.id) || [];
    const missingSessionIds = sessionIdsFromItems.filter(id => !SundaySessionIds.includes(id));

    if (missingSessionIds.length > 0) {
        console.log(`Found ${missingSessionIds.length} sessions that started before/after Sunday but have sales on Sunday:`);
        for (const mid of missingSessionIds) {
            const { data: sData } = await supabase.from('sales_sessions').select('started_at, status').eq('id', mid).single();
            const { count: mCount } = await supabase.from('sale_items').select('*', { count: 'exact', head: true }).eq('session_id', mid).eq('store_id', store.id).gte('created_at', start).lte('created_at', end);
            console.log(`- Session ${mid} (Started: ${sData?.started_at}, Status: ${sData?.status}): ${mCount} items on Sunday`);
        }
    }
}

deepAuditSales();
