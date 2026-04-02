-- Fix for SyncEngine Error: "there is no unique or exclusion constraint matching the ON CONFLICT specification"

-- 1. Ensure the schema is clean (prevents duplicate key errors on constraint addition)
DELETE FROM sale_items a USING sale_items b
WHERE a.id < b.id 
AND a.session_id = b.session_id 
AND a.product_id = b.product_id;

-- 2. Add the missing constraint that SyncEngine expects
ALTER TABLE sale_items 
ADD CONSTRAINT unique_session_product UNIQUE(session_id, product_id);

-- 3. (Optional) Update trigger to handle updates if upsert is ever used without ignoreDuplicates
CREATE OR REPLACE FUNCTION deduct_stock()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE products
        SET quantity = quantity - NEW.quantity,
            updated_at = NOW()
        WHERE id = NEW.product_id;
    ELSIF (TG_OP = 'UPDATE') THEN
        UPDATE products
        SET quantity = quantity - (NEW.quantity - OLD.quantity),
            updated_at = NOW()
        WHERE id = NEW.product_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_deduct_stock ON sale_items;
CREATE TRIGGER trigger_deduct_stock
AFTER INSERT OR UPDATE ON sale_items
FOR EACH ROW
EXECUTE FUNCTION deduct_stock();
