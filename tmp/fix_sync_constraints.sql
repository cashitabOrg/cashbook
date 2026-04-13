-- PREVENTION: Add Unique Constraint to prevent ghost duplicates
-- This ensures that for a single session, a product cannot be sold 
-- with the exact same quantity at the exact same millisecond multiple times.

-- First, let's verify if any duplicates remain (should be 0 after script)
-- SELECT session_id, product_id, quantity, created_at, COUNT(*)
-- FROM public.sale_items
-- GROUP BY session_id, product_id, quantity, created_at
-- HAVING COUNT(*) > 1;

ALTER TABLE public.sale_items
ADD CONSTRAINT unique_sale_item_sync 
UNIQUE (session_id, product_id, quantity, created_at);
