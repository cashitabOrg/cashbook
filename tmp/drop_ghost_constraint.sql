-- BUG FIX: Drop the aggressive unique constraint that was blocking identical fast sales
-- This ensures that a manager can sell the exact same item, quantity, and price
-- multiple times in a row without the database silently dropping the duplicate.

ALTER TABLE public.sale_items
DROP CONSTRAINT IF EXISTS unique_sale_item_sync;

-- The database is now set to deduplicate strictly using the primary key UUID (id), 
-- perfectly supporting the offline-first Sync Engine.
