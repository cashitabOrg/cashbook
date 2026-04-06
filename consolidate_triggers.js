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

const sql = `
-- 1. Remove the redundant initialization trigger
DROP TRIGGER IF EXISTS trigger_deduct_stock ON public.sale_items;

-- 2. Ensure the smarter trigger and its function are up to date
CREATE OR REPLACE FUNCTION public.handle_sale_item_changes()
RETURNS TRIGGER AS $$
DECLARE
    old_qty DECIMAL := 0;
    new_qty DECIMAL := 0;
    target_product_id UUID;
BEGIN
    if (TG_OP = 'DELETE') then
        target_product_id := OLD.product_id;
        old_qty := OLD.quantity;
        new_qty := 0;
    elsif (TG_OP = 'INSERT') then
        target_product_id := NEW.product_id;
        old_qty := 0;
        new_qty := NEW.quantity;
    elsif (TG_OP = 'UPDATE') then
        target_product_id := NEW.product_id;
        old_qty := OLD.quantity;
        new_qty := NEW.quantity;
    end if;

    UPDATE public.products
    SET quantity = quantity - (new_qty - old_qty),
        updated_at = NOW()
    WHERE id = target_product_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_stock_on_sale_change ON public.sale_items;
CREATE TRIGGER trg_sync_stock_on_sale_change
AFTER INSERT OR UPDATE OR DELETE ON public.sale_items
FOR EACH ROW
EXECUTE FUNCTION public.handle_sale_item_changes();
`;

async function main() {
    console.log('Attempting to consolidate database triggers...');
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
        console.error('FAILED to run SQL via RPC:', error.message);
        console.log('\n--- PLEASE RUN THIS SQL MANUALLY IN SUPABASE SQL EDITOR ---\n');
        console.log(sql);
        console.log('\n-----------------------------------------------------------\n');
    } else {
        console.log('SUCCESS: Triggers consolidated.');
    }
}

main();
