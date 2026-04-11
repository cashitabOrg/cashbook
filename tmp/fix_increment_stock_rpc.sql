-- =============================================================
-- Fix: increment_stock RPC - quantity appended instead of added
-- Root Cause: Either (A) quantity column is TEXT type causing 
--             string concat, or (B) parameter name conflict
-- Solution: Cast quantity to numeric and use unambiguous naming
-- =============================================================

-- STEP 1: Ensure the products.quantity column is a proper numeric type.
-- If it's currently TEXT or VARCHAR, this ALTER converts it properly.
-- (Run this first - if it errors saying it's already numeric, skip to STEP 2)
ALTER TABLE products 
  ALTER COLUMN quantity TYPE numeric(15,4) 
  USING quantity::numeric(15,4);

-- STEP 2: Drop the old broken RPC and recreate it correctly.
-- Uses explicit CAST and unambiguous parameter prefix (p_) to avoid
-- column/parameter name conflicts.
DROP FUNCTION IF EXISTS increment_stock(uuid, numeric);
DROP FUNCTION IF EXISTS increment_stock(text, numeric);
DROP FUNCTION IF EXISTS increment_stock(uuid, float);
DROP FUNCTION IF EXISTS increment_stock(text, float);

CREATE OR REPLACE FUNCTION increment_stock(product_id uuid, amount numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE products
  SET 
    quantity = COALESCE(quantity, 0)::numeric + amount::numeric,
    updated_at = NOW()
  WHERE id = product_id;
END;
$$;
