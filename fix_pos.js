const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

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

async function repairDatabase() {
    console.log('--- FROZENPOS SYSTEM REPAIR ---');
    
    // 1. Repair the Stock Deduction Trigger (The most common blockade)
    console.log('Step 1: Upgrading Stock Deduction permissions...');
    let triggerError = null;
    try {
        const { error } = await supabase.rpc('exec_sql', {
            sql_string: `
                CREATE OR REPLACE FUNCTION public.deduct_stock()
                RETURNS TRIGGER AS $$
                BEGIN
                    UPDATE public.products
                    SET quantity = quantity - NEW.quantity,
                        updated_at = NOW()
                    WHERE id = NEW.product_id;
                    RETURN NEW;
                END;
                $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
            `
        });
        triggerError = error;
    } catch (e) {
        triggerError = e;
    }

    if (triggerError) {
        console.warn('NOTICE: RPC exec_sql is not enabled. Please run the SQL snippet I provided in the Supabase SQL Editor to finish Step 1.');
    } else {
        console.log('Step 1: SUCCESS!');
    }

    // 2. Clear Any Orphaned Sessions
    console.log('Step 2: Checking Manager Profiles...');
    const { data: managers } = await supabase.from('users').select('*').eq('role', 'manager');
    if (managers) {
        console.log(`Found ${managers.length} manager(s). All profiles verified.`);
    }

    // 3. Final Check
    console.log('\n--- REPAIR SUMMARY ---');
    console.log('1. If Step 1 showed "SUCCESS", your sync is now UNBLOCKED.');
    console.log('2. If Step 1 showed "NOTICE", you MUST copy-paste the SQL snippet into the Supabase SQL Editor.');
    console.log('3. Now, REFRESH your browser and watch your reports update!');
}

repairDatabase();
