-- ==============================================================
-- DIAGNOSTIC: RLS INTEGRITY AUDIT
-- Run this in your Supabase SQL Editor to see which tables
-- are currently missing Row Level Security.
-- ==============================================================

SELECT 
    relname as table_name, 
    relrowsecurity as rls_enabled
FROM 
    pg_class c
JOIN 
    pg_namespace n ON n.oid = c.relnamespace
WHERE 
    n.nspname = 'public' 
    AND c.relkind = 'r'
ORDER BY 
    rls_enabled ASC;

-- ==============================================================
-- MANDATORY: ENABLE RLS ON ALL CORE TABLES
-- ==============================================================

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_additions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_price_logs ENABLE ROW LEVEL SECURITY;

-- ==============================================================
-- EXAMPLE POLICY: SECURE ISOLATION
-- (Adjust as needed for your specific roles)
-- ==============================================================

-- DROP POLICY IF EXISTS "Store Isolation Policy" ON public.products;
-- CREATE POLICY "Store Isolation Policy" ON public.products
--     FOR ALL
--     USING (store_id = ((auth.jwt() -> 'user_metadata' ->> 'store_id')::uuid));
