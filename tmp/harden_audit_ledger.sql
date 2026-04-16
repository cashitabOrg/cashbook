-- ==============================================================
-- MISSION CRITICAL: AUDIT LEDGER HARDENING (THE BLACK BOX)
-- This script transforms the ledger into an immutable, persistent 
-- audit log that survives product deletion and tracks all edits.
-- ==============================================================

-- 1. SCHEMA UPGRADE: PERSISTENCE & TRACEABILITY
ALTER TABLE public.inventory_movements ADD COLUMN IF NOT EXISTS product_name TEXT;

-- Change Product ID to SET NULL on delete so history is preserved
ALTER TABLE public.inventory_movements 
DROP CONSTRAINT IF EXISTS inventory_movements_product_id_fkey,
ADD CONSTRAINT inventory_movements_product_id_fkey 
FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;

-- 2. RESET EXISTING TRIGGERS
DROP TRIGGER IF EXISTS log_sale_movement ON public.sale_items;
DROP TRIGGER IF EXISTS trg_audit_sale_movement ON public.sale_items;
DROP TRIGGER IF EXISTS log_restock_movement ON public.stock_additions;
DROP TRIGGER IF EXISTS trg_audit_restock_movement ON public.stock_additions;
DROP TRIGGER IF EXISTS log_adjustment_movement ON public.stock_adjustments;
DROP TRIGGER IF EXISTS trg_audit_adjustment_movement ON public.stock_adjustments;

-- 3. HARDENED SALE TRANSACTION AUDITOR (INSERT/UPDATE/DELETE)
CREATE OR REPLACE FUNCTION trg_audit_sale_movement() RETURNS trigger AS $$
DECLARE
  v_qty_before NUMERIC;
  v_prod_name TEXT;
  v_prod_store_id UUID;
  v_actor_id UUID;
BEGIN
  v_actor_id := auth.uid();

  -- OPERATION: NEW SALE (INSERT)
  IF (TG_OP = 'INSERT') THEN
    SELECT quantity, name, store_id INTO v_qty_before, v_prod_name, v_prod_store_id FROM public.products WHERE id = NEW.product_id FOR UPDATE;
    
    INSERT INTO public.inventory_movements (
      store_id, product_id, product_name, transaction_type, quantity_before, quantity_change, quantity_after, reference_id, actor_id, note
    ) VALUES (
      NEW.store_id, NEW.product_id, v_prod_name, 'SALE', v_qty_before, -NEW.quantity, v_qty_before - NEW.quantity, NEW.id, v_actor_id, 'Customer Checkout'
    );
    RETURN NEW;

  -- OPERATION: EDITED SALE (UPDATE)
  ELSIF (TG_OP = 'UPDATE') THEN
    -- Only log if the quantity actually changed
    IF OLD.quantity IS DISTINCT FROM NEW.quantity OR OLD.product_id IS DISTINCT FROM NEW.product_id THEN
      SELECT quantity, name INTO v_qty_before, v_prod_name FROM public.products WHERE id = NEW.product_id FOR UPDATE;
      
      INSERT INTO public.inventory_movements (
        store_id, product_id, product_name, transaction_type, quantity_before, quantity_change, quantity_after, reference_id, actor_id, note
      ) VALUES (
        NEW.store_id, NEW.product_id, v_prod_name, 'SALE_EDIT', v_qty_before, (OLD.quantity - NEW.quantity), v_qty_before + (OLD.quantity - NEW.quantity), NEW.id, v_actor_id, 
        'EDITED - Adjustment from ' || OLD.quantity || ' to ' || NEW.quantity
      );
    END IF;
    RETURN NEW;

  -- OPERATION: DELETED SALE (DELETE)
  ELSIF (TG_OP = 'DELETE') THEN
    SELECT quantity, name INTO v_qty_before, v_prod_name FROM public.products WHERE id = OLD.product_id FOR UPDATE;
    
    INSERT INTO public.inventory_movements (
      store_id, product_id, product_name, transaction_type, quantity_before, quantity_change, quantity_after, reference_id, actor_id, note
    ) VALUES (
      OLD.store_id, OLD.product_id, v_prod_name, 'SALE_VOID', v_qty_before, OLD.quantity, v_qty_before + OLD.quantity, OLD.id, v_actor_id, 
      'DELETED - Restored ' || OLD.quantity || ' back to stock'
    );
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_audit_sale_movement ON public.sale_items;
CREATE TRIGGER trg_audit_sale_movement
AFTER INSERT OR UPDATE OR DELETE ON public.sale_items
FOR EACH ROW EXECUTE FUNCTION trg_audit_sale_movement();


-- 4. HARDENED RESTOCK AUDITOR
CREATE OR REPLACE FUNCTION trg_audit_restock_movement() RETURNS trigger AS $$
DECLARE
  v_qty_before NUMERIC;
  v_prod_name TEXT;
BEGIN
  IF (TG_OP = 'INSERT') THEN
    SELECT quantity, name INTO v_qty_before, v_prod_name FROM public.products WHERE id = NEW.product_id FOR UPDATE;
    INSERT INTO public.inventory_movements (
      store_id, product_id, product_name, transaction_type, quantity_before, quantity_change, quantity_after, reference_id, actor_id, note
    ) VALUES (
      NEW.store_id, NEW.product_id, v_prod_name, 'RESTOCK', v_qty_before, NEW.quantity_added, v_qty_before + NEW.quantity_added, NEW.id, NEW.admin_id, COALESCE(NEW.note, 'Warehouse Restock')
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_audit_restock_movement ON public.stock_additions;
CREATE TRIGGER trg_audit_restock_movement
AFTER INSERT ON public.stock_additions
FOR EACH ROW EXECUTE FUNCTION trg_audit_restock_movement();


-- 5. HARDENED ADJUSTMENT AUDITOR
CREATE OR REPLACE FUNCTION trg_audit_adjustment_movement() RETURNS trigger AS $$
DECLARE
  v_qty_before NUMERIC;
  v_prod_name TEXT;
  v_type VARCHAR;
BEGIN
  IF (TG_OP = 'INSERT') THEN
    SELECT quantity, name INTO v_qty_before, v_prod_name FROM public.products WHERE id = NEW.product_id FOR UPDATE;
    
    IF NEW.quantity_change < 0 THEN v_type := 'LOSS (-)'; ELSE v_type := 'GAIN (+)'; END IF;

    INSERT INTO public.inventory_movements (
      store_id, product_id, product_name, transaction_type, quantity_before, quantity_change, quantity_after, reference_id, actor_id, note
    ) VALUES (
      NEW.store_id, NEW.product_id, v_prod_name, v_type, v_qty_before, NEW.quantity_change, v_qty_before + NEW.quantity_change, NEW.id, NEW.admin_id, 
      COALESCE(NEW.reason, 'Correction') || ' - ' || COALESCE(NEW.note, '')
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_audit_adjustment_movement ON public.stock_adjustments;
CREATE TRIGGER trg_audit_adjustment_movement
AFTER INSERT ON public.stock_adjustments
FOR EACH ROW EXECUTE FUNCTION trg_audit_adjustment_movement();


-- 6. DATA MIGRATION: Populating existing product_name history
UPDATE public.inventory_movements m
SET product_name = p.name
FROM public.products p
WHERE m.product_id = p.id
AND m.product_name IS NULL;
