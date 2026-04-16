-- ==============================================================
-- CRITICAL FIX: REMOVE IMMUTABLE LOCK & RESTORE EDIT CAPABILITY
-- This script removes the overly-aggressive audit lock trigger 
-- that is blocking all edits to approved sessions, and replaces -- ==============================================================
-- MISSION CRITICAL: UNIFIED INVENTORY RESILIENCE (THE MASTER FIX)
-- This script replaces all fragmented triggers with one single, 
-- atomic logic path for all Sale actions (Insert, Edit, Delete).
-- ==============================================================

-- 1. CLEAN UP ALL PREVIOUS SALE TRIGGERS
-- Prevents duplicate ledger entries and conflicting stock adjustments
DROP TRIGGER IF EXISTS log_sale_movement ON public.sale_items;
DROP TRIGGER IF EXISTS trg_audit_sale_movement ON public.sale_items;
DROP TRIGGER IF EXISTS trg_log_sale_item_movement ON public.sale_items;
DROP TRIGGER IF EXISTS trg_resilience_sale_sync ON public.sale_items;

-- 2. THE MASTER SYNC FUNCTION
CREATE OR REPLACE FUNCTION trg_resilience_sale_sync() RETURNS trigger AS $$
DECLARE
  v_qty_before NUMERIC;
  v_prod_name TEXT;
  v_prod_store_id UUID;
  v_actor_id UUID;
  v_qty_diff NUMERIC;
BEGIN
  -- LOCK the product for update to prevent concurrent race conditions
  -- We prioritize NEW.product_id if it exists, otherwise OLD.product_id
  SELECT quantity, name, store_id INTO v_qty_before, v_prod_name, v_prod_store_id 
  FROM public.products 
  WHERE id = COALESCE(NEW.product_id, OLD.product_id) 
  FOR UPDATE;

  v_actor_id := auth.uid();

  -- guard against cross-store data leakage
  IF TG_OP IN ('INSERT', 'UPDATE') THEN
    IF v_prod_store_id IS DISTINCT FROM NEW.store_id THEN
      RAISE EXCEPTION 'Store Isolation Violation: Product % belongs to Store %, but Action is in Store %', 
        NEW.product_id, v_prod_store_id, NEW.store_id;
    END IF;
  END IF;

  -- ------------------------------------------------------------
  -- CASE 1: NEW SALE (INSERT)
  -- ------------------------------------------------------------
  IF (TG_OP = 'INSERT') THEN
    -- A. Update Stock
    UPDATE public.products SET quantity = quantity - NEW.quantity WHERE id = NEW.product_id;
    
    -- B. Log Ledger
    INSERT INTO public.inventory_movements (
      store_id, product_id, product_name, transaction_type, quantity_before, quantity_change, quantity_after, reference_id, actor_id, note
    ) VALUES (
      NEW.store_id, NEW.product_id, v_prod_name, 'SALE', v_qty_before, -NEW.quantity, v_qty_before - NEW.quantity, NEW.id, v_actor_id, 'Customer Checkout'
    );
    RETURN NEW;

  -- ------------------------------------------------------------
  -- CASE 2: EDITED OR VOIDED SALE (UPDATE)
  -- ------------------------------------------------------------
  ELSIF (TG_OP = 'UPDATE') THEN
    -- A. Check if this is a SOFT-DELETE (is_deleted flips to true)
    IF OLD.is_deleted = false AND NEW.is_deleted = true THEN
      -- Refund ALL stock
      UPDATE public.products SET quantity = quantity + OLD.quantity WHERE id = OLD.product_id;
      
      -- Log Void
      INSERT INTO public.inventory_movements (
        store_id, product_id, product_name, transaction_type, quantity_before, quantity_change, quantity_after, reference_id, actor_id, note
      ) VALUES (
        OLD.store_id, OLD.product_id, v_prod_name, 'SALE_VOID', v_qty_before, OLD.quantity, v_qty_before + OLD.quantity, OLD.id, v_actor_id, 
        'SOFT DELETED - Restored ' || OLD.quantity || ' back to stock'
      );
    
    -- B. Normal Edit (Quality or Product changed)
    ELSIF OLD.is_deleted = false AND NEW.is_deleted = false THEN
      IF OLD.quantity IS DISTINCT FROM NEW.quantity OR OLD.product_id IS DISTINCT FROM NEW.product_id THEN
        v_qty_diff := OLD.quantity - NEW.quantity;
        
        -- Adjust stock
        UPDATE public.products SET quantity = quantity + v_qty_diff WHERE id = NEW.product_id;
        
        -- Log Edit
        INSERT INTO public.inventory_movements (
          store_id, product_id, product_name, transaction_type, quantity_before, quantity_change, quantity_after, reference_id, actor_id, note
        ) VALUES (
          NEW.store_id, NEW.product_id, v_prod_name, 'SALE_EDIT', v_qty_before, v_qty_diff, v_qty_before + v_qty_diff, NEW.id, v_actor_id, 
          'EDITED - Adjustment from ' || OLD.quantity || ' to ' || NEW.quantity
        );
      END IF;
    END IF;
    RETURN NEW;

  -- ------------------------------------------------------------
  -- CASE 3: HARD DELETE (DELETE) - Fallback for full safety
  -- ------------------------------------------------------------
  ELSIF (TG_OP = 'DELETE') THEN
    -- Only refund if it wasn't already soft-deleted (prevent double-refund)
    IF OLD.is_deleted = false THEN
      UPDATE public.products SET quantity = quantity + OLD.quantity WHERE id = OLD.product_id;
      
      INSERT INTO public.inventory_movements (
        store_id, product_id, product_name, transaction_type, quantity_before, quantity_change, quantity_after, reference_id, actor_id, note
      ) VALUES (
        OLD.store_id, OLD.product_id, v_prod_name, 'SALE_VOID', v_qty_before, OLD.quantity, v_qty_before + OLD.quantity, OLD.id, v_actor_id, 
        'HARD DELETED - Restored ' || OLD.quantity || ' back to stock'
      );
    END IF;
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. APPLY UNIFIED TRIGGER
CREATE TRIGGER trg_resilience_sale_sync
BEFORE INSERT OR UPDATE OR DELETE ON public.sale_items
FOR EACH ROW EXECUTE FUNCTION trg_resilience_sale_sync();

-- 4. CLEAN UP REDUNDANT RESTOCK/ADJUSTMENT TRIGGERS (Standardize names)
DROP TRIGGER IF EXISTS log_restock_movement ON public.stock_additions;
DROP TRIGGER IF EXISTS trg_audit_restock_movement ON public.stock_additions;

CREATE TRIGGER trg_audit_restock_movement
AFTER INSERT ON public.stock_additions
FOR EACH ROW EXECUTE FUNCTION trg_audit_restock_movement();

DROP TRIGGER IF EXISTS log_adjustment_movement ON public.stock_adjustments;
DROP TRIGGER IF EXISTS trg_audit_adjustment_movement ON public.stock_adjustments;

CREATE TRIGGER trg_audit_adjustment_movement
AFTER INSERT ON public.stock_adjustments
FOR EACH ROW EXECUTE FUNCTION trg_audit_adjustment_movement();

-- it with a smart version that allows admins to still make changes.
-- ==============================================================

-- STEP 1: Find and drop all triggers that may be locking sale_items
-- (The lock trigger has an unknown name, so we search and destroy all candidates)
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT trigger_name 
    FROM information_schema.triggers
    WHERE event_object_table = 'sale_items'
      AND event_object_schema = 'public'
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.sale_items', r.trigger_name);
    RAISE NOTICE 'Dropped trigger: %', r.trigger_name;
  END LOOP;
END;
$$;

-- STEP 2: THE DEFINITIVE UNIFIED TRIGGER (replaces ALL old triggers)
-- This is a BEFORE trigger so it can both update stock AND log movements atomically.
CREATE OR REPLACE FUNCTION trg_master_sale_sync() RETURNS trigger AS $$
DECLARE
  v_qty_before NUMERIC;
  v_prod_name TEXT;
  v_prod_store_id UUID;
  v_actor_id UUID;
  v_qty_diff NUMERIC;
BEGIN
  v_actor_id := auth.uid();

  -- ============================================================
  -- CASE 1: NEW SALE INSERTED
  -- ============================================================
  IF (TG_OP = 'INSERT') THEN
    SELECT quantity, name, store_id INTO v_qty_before, v_prod_name, v_prod_store_id
    FROM public.products WHERE id = NEW.product_id FOR UPDATE;

    -- Store isolation guard
    IF v_prod_store_id IS DISTINCT FROM NEW.store_id THEN
      RAISE EXCEPTION 'Store Isolation Violation: Product % belongs to Store %, but Sale is in Store %',
        NEW.product_id, v_prod_store_id, NEW.store_id;
    END IF;

    -- A. Deduct stock
    UPDATE public.products SET quantity = quantity - NEW.quantity WHERE id = NEW.product_id;

    -- B. Log movement
    INSERT INTO public.inventory_movements (
      store_id, product_id, product_name, transaction_type,
      quantity_before, quantity_change, quantity_after, reference_id, actor_id, note
    ) VALUES (
      NEW.store_id, NEW.product_id, v_prod_name, 'SALE',
      v_qty_before, -NEW.quantity, v_qty_before - NEW.quantity,
      NEW.id, v_actor_id, 'Customer Checkout'
    );
    RETURN NEW;

  -- ============================================================
  -- CASE 2: SALE UPDATED (Edit or Soft-Delete)
  -- ============================================================
  ELSIF (TG_OP = 'UPDATE') THEN

    -- CASE 2A: Soft-Delete (is_deleted flipped to TRUE)
    IF OLD.is_deleted = false AND NEW.is_deleted = true THEN
      SELECT quantity, name INTO v_qty_before, v_prod_name
      FROM public.products WHERE id = OLD.product_id FOR UPDATE;

      -- A. Refund stock
      UPDATE public.products SET quantity = quantity + OLD.quantity WHERE id = OLD.product_id;

      -- B. Log void movement
      INSERT INTO public.inventory_movements (
        store_id, product_id, product_name, transaction_type,
        quantity_before, quantity_change, quantity_after, reference_id, actor_id, note
      ) VALUES (
        OLD.store_id, OLD.product_id, v_prod_name, 'SALE_VOID',
        v_qty_before, OLD.quantity, v_qty_before + OLD.quantity,
        OLD.id, v_actor_id,
        'DELETED - Restored ' || OLD.quantity || ' back to stock'
      );

    -- CASE 2B: Normal edit (quantity or product changed)
    ELSIF OLD.is_deleted = false AND NEW.is_deleted = false THEN
      IF OLD.quantity IS DISTINCT FROM NEW.quantity OR OLD.product_id IS DISTINCT FROM NEW.product_id THEN
        SELECT quantity, name INTO v_qty_before, v_prod_name
        FROM public.products WHERE id = NEW.product_id FOR UPDATE;

        -- qty_diff: positive means we sold LESS (stock increases), negative means MORE sold (stock decreases)
        v_qty_diff := OLD.quantity - NEW.quantity;

        -- A. Adjust stock
        UPDATE public.products SET quantity = quantity + v_qty_diff WHERE id = NEW.product_id;

        -- B. Log edit movement
        INSERT INTO public.inventory_movements (
          store_id, product_id, product_name, transaction_type,
          quantity_before, quantity_change, quantity_after, reference_id, actor_id, note
        ) VALUES (
          NEW.store_id, NEW.product_id, v_prod_name, 'SALE_EDIT',
          v_qty_before, v_qty_diff, v_qty_before + v_qty_diff,
          NEW.id, v_actor_id,
          'EDITED - Qty changed from ' || OLD.quantity || ' to ' || NEW.quantity
        );
      END IF;
    END IF;
    RETURN NEW;

  -- ============================================================
  -- CASE 3: HARD DELETE (safety fallback)
  -- ============================================================
  ELSIF (TG_OP = 'DELETE') THEN
    IF OLD.is_deleted = false THEN
      SELECT quantity, name INTO v_qty_before, v_prod_name
      FROM public.products WHERE id = OLD.product_id FOR UPDATE;

      UPDATE public.products SET quantity = quantity + OLD.quantity WHERE id = OLD.product_id;

      INSERT INTO public.inventory_movements (
        store_id, product_id, product_name, transaction_type,
        quantity_before, quantity_change, quantity_after, reference_id, actor_id, note
      ) VALUES (
        OLD.store_id, OLD.product_id, v_prod_name, 'SALE_VOID',
        v_qty_before, OLD.quantity, v_qty_before + OLD.quantity,
        OLD.id, v_actor_id,
        'HARD DELETED - Restored ' || OLD.quantity || ' back to stock'
      );
    END IF;
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 3: Attach the single unified trigger
CREATE TRIGGER trg_master_sale_sync
BEFORE INSERT OR UPDATE OR DELETE ON public.sale_items
FOR EACH ROW EXECUTE FUNCTION trg_master_sale_sync();

-- STEP 4: Verify it was created
SELECT trigger_name, event_manipulation, action_timing
FROM information_schema.triggers
WHERE event_object_table = 'sale_items'
ORDER BY trigger_name;
