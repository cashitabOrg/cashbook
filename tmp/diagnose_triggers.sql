-- ==============================================================
-- FULL DIAGNOSTIC: Check what triggers actually exist on sale_items
-- Run this in your Supabase SQL Editor to see the ground truth
-- ==============================================================

-- 1. List all triggers on sale_items
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'sale_items'
ORDER BY trigger_name;

-- 2. Check if inventory_movements has a product_name column
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_name = 'inventory_movements'
ORDER BY ordinal_position;

-- 3. Check last 5 movements to see if trigger is firing at all
SELECT id, transaction_type, quantity_before, quantity_change, quantity_after, note, created_at
FROM public.inventory_movements
ORDER BY created_at DESC
LIMIT 5;

-- 4. Check last 5 sale_items updates (any recent edits?)
SELECT id, product_id, quantity, subtotal, is_deleted, created_at
FROM public.sale_items
ORDER BY created_at DESC
LIMIT 5;
