-- =========================================================================
-- Fix: Allow Multiple Sales of the Same Product in a Single Session
-- =========================================================================

-- 1. Remove the restrictive unique constraint
-- This constraint was preventing more than one row for the same product in a single session.
-- Legitimately separate sales (e.g. at different times) were being blocked.
ALTER TABLE sale_items DROP CONSTRAINT IF EXISTS unique_session_product;

-- 2. Verify: Ensure the 'id' column is the primary key and accepts UUIDs
-- (This should already be the case based on frozenpos-init.sql)
-- The application now sends a POS-generated UUID for each row to 'id'.
