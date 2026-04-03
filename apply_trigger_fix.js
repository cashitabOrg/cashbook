const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// 1. Load Environment Variables
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

const sql = `
-- 1. Create or replace the function to handle ALL sale item changes
create or replace function public.handle_sale_item_changes()
returns trigger
as $$
declare
    old_qty decimal := 0;
    new_qty decimal := 0;
    target_product_id uuid;
begin
    -- Determine which product and what quantities we are dealing with
    if (TG_OP = 'DELETE') then
        target_product_id := old.product_id;
        old_qty := old.quantity;
        new_qty := 0;
    elsif (TG_OP = 'INSERT') then
        target_product_id := new.product_id;
        old_qty := 0;
        new_qty := new.quantity;
    elsif (TG_OP = 'UPDATE') then
        target_product_id := new.product_id;
        old_qty := old.quantity;
        new_qty := new.quantity;
    end if;

    -- Update products.quantity: (New Quantity - Old Quantity) should be subtracted
    -- If it's a delete: 0 - 5 = -5. Subtracting -5 is same as adding 5 (Refund).
    -- If it's an insert: 5 - 0 = 5. Subtracting 5 is same as deducting 5 (Deduction).
    -- If it's an update: 10 - 5 = 5. Subtracting 5 is same as deducting 5 more.
    update public.products
    set quantity = quantity - (new_qty - old_qty)
    where id = target_product_id;

    return null;
end;
$$ language plpgsql;

-- 2. Drop the old single-purpose trigger if it exists
drop trigger if exists trg_deduct_stock_on_sale on public.sale_items;

-- 3. Create the new all-purpose trigger
create trigger trg_sync_stock_on_sale_change
after insert or update or delete on public.sale_items
for each row
execute function public.handle_sale_item_changes();
`;

async function applyMigration() {
    console.log('Applying Smarter Stock Trigger Migration...');
    
    // We try running it through an RPC if defined, or just logging it. 
    // Since direct SQL is hard to run via SDK without an RPC, I will provide the SQL
    // but try to use a dummy RPC if the user has a query executor.
    
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
        console.error('Failed to run SQL via RPC. You must run this SQL manually in Supabase Dashboard:\n');
        console.log(sql);
    } else {
        console.log('Successfully applied Smarter Stock Triggers!');
    }
}

applyMigration();
