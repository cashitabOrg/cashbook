-- Migration: Add is_archived column to products table
-- This enables soft-delete: products with is_archived=true are hidden from
-- all active lists/dropdowns but their sales history and audit trail remain intact.

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT false;

-- Index for fast filtering (active products only)
CREATE INDEX IF NOT EXISTS idx_products_store_active
  ON products (store_id, is_archived)
  WHERE is_archived = false;
