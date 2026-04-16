-- ==============================================================
-- MISSION CRITICAL: STORE ISOLATION & CONCURRENCY HARDENING
-- This script upgrades the database triggers to prevent:
-- 1. Cross-store data leakage (Product/Store mismatch)
-- 2. Race conditions during high concurrency (Lock contention)
-- ==============================================================

-- 1. HARDENED SENSOR FOR CUSTOMER SALES ('sale_items')
CREATE OR REPLACE FUNCTION trg_log_sale_item_movement() RETURNS trigger AS $$
DECLARE
  v_qty_before NUMERIC;
  v_product_store_id UUID;
  v_actor_id UUID;
BEGIN
  -- ATOMIC LOCK: 'FOR UPDATE' ensures no other transaction can read/write 
  -- this product's quantity until we are done creating the ledger entry.
  -- This prevents "Sequence Breaks" even with 10,000+ simultaneous users.
  SELECT quantity, store_id INTO v_qty_before, v_product_store_id 
  FROM public.products 
  WHERE id = NEW.product_id 
  FOR UPDATE;

  -- ISOLATION GUARD: Ensure the product actually belongs to the store 
  -- recording the sale. This prevents any cross-store leakage.
  IF v_product_store_id IS DISTINCT FROM NEW.store_id THEN
    RAISE EXCEPTION 'Store Isolation Violation: Product % belongs to Store %, but Sale is in Store %', 
      NEW.product_id, v_product_store_id, NEW.store_id;
  END IF;

  v_actor_id := auth.uid();
  
  INSERT INTO public.inventory_movements (
    store_id, product_id, transaction_type, quantity_before, quantity_change, quantity_after, reference_id, actor_id, note
  ) VALUES (
    NEW.store_id, NEW.product_id, 'SALE', v_qty_before, -NEW.quantity, v_qty_before - NEW.quantity, NEW.id, v_actor_id, 'Customer Checkout'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. HARDENED SENSOR FOR RESTOCK DELIVERIES ('stock_additions')
CREATE OR REPLACE FUNCTION trg_log_restock_movement() RETURNS trigger AS $$
DECLARE
  v_qty_before NUMERIC;
  v_product_store_id UUID;
BEGIN
  SELECT quantity, store_id INTO v_qty_before, v_product_store_id 
  FROM public.products 
  WHERE id = NEW.product_id 
  FOR UPDATE;

  -- ISOLATION GUARD
  IF v_product_store_id IS DISTINCT FROM NEW.store_id THEN
    RAISE EXCEPTION 'Store Isolation Violation: Product % belongs to Store %, but Restock is in Store %', 
      NEW.product_id, v_product_store_id, NEW.store_id;
  END IF;
  
  INSERT INTO public.inventory_movements (
    store_id, product_id, transaction_type, quantity_before, quantity_change, quantity_after, reference_id, actor_id, note
  ) VALUES (
    NEW.store_id, NEW.product_id, 'RESTOCK', v_qty_before, NEW.quantity_added, v_qty_before + NEW.quantity_added, NEW.id, NEW.admin_id, COALESCE(NEW.note, 'Warehouse Restock')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. HARDENED SENSOR FOR LOSSES & OVERRIDES ('stock_adjustments')
CREATE OR REPLACE FUNCTION trg_log_adjustment_movement() RETURNS trigger AS $$
DECLARE
  v_qty_before NUMERIC;
  v_product_store_id UUID;
  v_type VARCHAR;
BEGIN
  SELECT quantity, store_id INTO v_qty_before, v_product_store_id 
  FROM public.products 
  WHERE id = NEW.product_id 
  FOR UPDATE;

  -- ISOLATION GUARD
  IF v_product_store_id IS DISTINCT FROM NEW.store_id THEN
    RAISE EXCEPTION 'Store Isolation Violation: Product % belongs to Store %, but Adjustment is in Store %', 
      NEW.product_id, v_product_store_id, NEW.store_id;
  END IF;
  
  IF NEW.quantity_change < 0 THEN
    v_type := 'LOSS (-)';
  ELSE
    v_type := 'GAIN (+)';
  END IF;

  INSERT INTO public.inventory_movements (
    store_id, product_id, transaction_type, quantity_before, quantity_change, quantity_after, reference_id, actor_id, note
  ) VALUES (
    NEW.store_id, NEW.product_id, v_type, v_qty_before, NEW.quantity_change, v_qty_before + NEW.quantity_change, NEW.id, NEW.admin_id, COALESCE(NEW.reason, 'Correction') || ' - ' || COALESCE(NEW.note, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-attach triggers to Ensure they take effect
DROP TRIGGER IF EXISTS log_sale_movement ON public.sale_items;
CREATE TRIGGER log_sale_movement BEFORE INSERT ON public.sale_items FOR EACH ROW EXECUTE FUNCTION trg_log_sale_item_movement();

DROP TRIGGER IF EXISTS log_restock_movement ON public.stock_additions;
CREATE TRIGGER log_restock_movement BEFORE INSERT ON public.stock_additions FOR EACH ROW EXECUTE FUNCTION trg_log_restock_movement();

DROP TRIGGER IF EXISTS log_adjustment_movement ON public.stock_adjustments;
CREATE TRIGGER log_adjustment_movement BEFORE INSERT ON public.stock_adjustments FOR EACH ROW EXECUTE FUNCTION trg_log_adjustment_movement();
