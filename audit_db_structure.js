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

async function audit() {
    console.log('--- Database Audit ---');
    
    // 1. Check Triggers
    const { data: triggers, error: tError } = await supabase.rpc('exec_sql', { 
        sql_query: "SELECT event_object_table, trigger_name, action_timing, event_manipulation FROM information_schema.triggers WHERE trigger_schema = 'public'" 
    });
    if (tError) console.error('Triggers Error:', tError.message);
    else console.log('Triggers:', triggers);

    // 2. Check RLS Policies
    const { data: policies, error: pError } = await supabase.rpc('exec_sql', { 
        sql_query: "SELECT tablename, policyname, cmd, qual FROM pg_policies WHERE schemaname = 'public'" 
    });
    if (pError) console.error('Policies Error:', pError.message);
    else console.log('Policies:', policies);

    // 3. Check for any "invisible" stock additions or subtractions
    // Let's verify Gizzard's history again
    const { data: gizzard } = await supabase.from('products').select('*').eq('name', 'Gizzard').single();
    if (gizzard) {
      const { data: adds } = await supabase.from('stock_additions').select('*').eq('product_id', gizzard.id);
      const { data: sales } = await supabase.from('sale_items').select('*').eq('product_id', gizzard.id);
      console.log('\nGizzard Audit:');
      console.log('Product Qty:', gizzard.quantity);
      console.log('Log Sum (Added):', adds?.reduce((a,b) => a + Number(b.quantity_added), 0));
      console.log('Log Sum (Sold):', sales?.reduce((a,b) => a + Number(b.quantity), 0));
    }
}

audit();
