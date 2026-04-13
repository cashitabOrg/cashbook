-- ==============================================================
-- PHASE 2: DATABASE TRIGGERS (THE SENSORS)
-- Run this in your Supabase SQL Editor
-- ==============================================================

-- 1. SENSOR FOR CUSTOMER SALES ('sale_items')
CREATE OR REPLACE FUNCTION trg_log_sale_item_movement() RETURNS trigger AS $$
DECLARE
  v_qty_before NUMERIC;
  v_actor_id UUID;
BEGIN
  -- Look at the fridge right before the customer takes it
  SELECT quantity INTO v_qty_before FROM public.products WHERE id = NEW.product_id;
  v_actor_id := auth.uid(); -- Automatically grabs the Manager who is checked in
  
  -- Print the bank receipt
  INSERT INTO public.inventory_movements (
    store_id, product_id, transaction_type, quantity_before, quantity_change, quantity_after, reference_id, actor_id, note
  ) VALUES (
    NEW.store_id, NEW.product_id, 'SALE', v_qty_before, -NEW.quantity, v_qty_before - NEW.quantity, NEW.id, v_actor_id, 'Customer Checkout'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS log_sale_movement ON public.sale_items;
CREATE TRIGGER log_sale_movement
BEFORE INSERT ON public.sale_items
FOR EACH ROW EXECUTE FUNCTION trg_log_sale_item_movement();


-- 2. SENSOR FOR RESTOCK DELIVERIES ('stock_additions')
CREATE OR REPLACE FUNCTION trg_log_restock_movement() RETURNS trigger AS $$
DECLARE
  v_qty_before NUMERIC;
BEGIN
  SELECT quantity INTO v_qty_before FROM public.products WHERE id = NEW.product_id;
  
  INSERT INTO public.inventory_movements (
    store_id, product_id, transaction_type, quantity_before, quantity_change, quantity_after, reference_id, actor_id, note
  ) VALUES (
    NEW.store_id, NEW.product_id, 'RESTOCK', v_qty_before, NEW.quantity_added, v_qty_before + NEW.quantity_added, NEW.id, NEW.admin_id, COALESCE(NEW.note, 'Warehouse Restock')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS log_restock_movement ON public.stock_additions;
CREATE TRIGGER log_restock_movement
BEFORE INSERT ON public.stock_additions
FOR EACH ROW EXECUTE FUNCTION trg_log_restock_movement();


-- 3. SENSOR FOR LOSSES & OVERRIDES ('stock_adjustments')
CREATE OR REPLACE FUNCTION trg_log_adjustment_movement() RETURNS trigger AS $$
DECLARE
  v_qty_before NUMERIC;
  v_type VARCHAR;
BEGIN
  SELECT quantity INTO v_qty_before FROM public.products WHERE id = NEW.product_id;
  
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

DROP TRIGGER IF EXISTS log_adjustment_movement ON public.stock_adjustments;
CREATE TRIGGER log_adjustment_movement
BEFORE INSERT ON public.stock_adjustments
FOR EACH ROW EXECUTE FUNCTION trg_log_adjustment_movement();
