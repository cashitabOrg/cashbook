-- ==============================================================
-- SOFT DELETE IMPLEMENTATION FOR SALES INTEGRITY
-- This enables "Tags" in Reports and prevent data vanishing.
-- ==============================================================

-- 1. ADD SOFT DELETE COLUMN
ALTER TABLE public.sale_items ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
CREATE INDEX IF NOT EXISTS idx_sale_items_is_deleted ON public.sale_items(is_deleted) WHERE is_deleted = true;

-- 2. UPDATE AUDIT TRIGGER TO DETECT SOFT-DELETE
-- We need to change the trigger to log a 'SALE_VOID' when is_deleted flips to true.
CREATE OR REPLACE FUNCTION trg_audit_sale_movement() RETURNS trigger AS $$
DECLARE
  v_qty_before NUMERIC;
  v_prod_name TEXT;
  v_actor_id UUID;
BEGIN
  v_actor_id := auth.uid();

  -- OPERATION: NEW SALE (INSERT)
  IF (TG_OP = 'INSERT') THEN
    SELECT quantity, name INTO v_qty_before, v_prod_name FROM public.products WHERE id = NEW.product_id FOR UPDATE;
    
    INSERT INTO public.inventory_movements (
      store_id, product_id, product_name, transaction_type, quantity_before, quantity_change, quantity_after, reference_id, actor_id, note
    ) VALUES (
      NEW.store_id, NEW.product_id, v_prod_name, 'SALE', v_qty_before, -NEW.quantity, v_qty_before - NEW.quantity, NEW.id, v_actor_id, 'Customer Checkout'
    );
    RETURN NEW;

  -- OPERATION: EDITED OR SOFT-DELETED SALE (UPDATE)
  ELSIF (TG_OP = 'UPDATE') THEN
    
    -- CASE A: Item was just SOFT-DELETED
    IF OLD.is_deleted = false AND NEW.is_deleted = true THEN
      SELECT quantity, name INTO v_qty_before, v_prod_name FROM public.products WHERE id = OLD.product_id FOR UPDATE;
      
      INSERT INTO public.inventory_movements (
        store_id, product_id, product_name, transaction_type, quantity_before, quantity_change, quantity_after, reference_id, actor_id, note
      ) VALUES (
        OLD.store_id, OLD.product_id, v_prod_name, 'SALE_VOID', v_qty_before, OLD.quantity, v_qty_before + OLD.quantity, OLD.id, v_actor_id, 
        'DELETED - Restored ' || OLD.quantity || ' back to stock'
      );
      
      -- Also automatically restore the product stock if not already handled
      UPDATE public.products SET quantity = quantity + OLD.quantity WHERE id = OLD.product_id;

    -- CASE B: Normal Quantity/Product Edit
    ELSIF OLD.is_deleted = false AND NEW.is_deleted = false THEN
      IF OLD.quantity IS DISTINCT FROM NEW.quantity OR OLD.product_id IS DISTINCT FROM NEW.product_id THEN
        SELECT quantity, name INTO v_qty_before, v_prod_name FROM public.products WHERE id = NEW.product_id FOR UPDATE;
        
        INSERT INTO public.inventory_movements (
          store_id, product_id, product_name, transaction_type, quantity_before, quantity_change, quantity_after, reference_id, actor_id, note
        ) VALUES (
          NEW.store_id, NEW.product_id, v_prod_name, 'SALE_EDIT', v_qty_before, (OLD.quantity - NEW.quantity), v_qty_before + (OLD.quantity - NEW.quantity), NEW.id, v_actor_id, 
          'EDITED - Adjustment from ' || OLD.quantity || ' to ' || NEW.quantity
        );
        
        -- Sync product stock for Edit
        UPDATE public.products SET quantity = quantity + (OLD.quantity - NEW.quantity) WHERE id = NEW.product_id;
      END IF;
    END IF;
    RETURN NEW;

  -- OPERATION: HARD DELETE (fallback for safety)
  ELSIF (TG_OP = 'DELETE') THEN
    IF OLD.is_deleted = false THEN
      SELECT quantity, name INTO v_qty_before, v_prod_name FROM public.products WHERE id = OLD.product_id FOR UPDATE;
      INSERT INTO public.inventory_movements (
        store_id, product_id, product_name, transaction_type, quantity_before, quantity_change, quantity_after, reference_id, actor_id, note
      ) VALUES (
        OLD.store_id, OLD.product_id, v_prod_name, 'SALE_VOID', v_qty_before, OLD.quantity, v_qty_before + OLD.quantity, OLD.id, v_actor_id, 
        'HARD DELETED - Restored ' || OLD.quantity || ' back to stock'
      );
      UPDATE public.products SET quantity = quantity + OLD.quantity WHERE id = OLD.product_id;
    END IF;
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. APPLY TRIGGER
DROP TRIGGER IF EXISTS trg_audit_sale_movement ON public.sale_items;
CREATE TRIGGER trg_audit_sale_movement
AFTER INSERT OR UPDATE OR DELETE ON public.sale_items
FOR EACH ROW EXECUTE FUNCTION trg_audit_sale_movement();
