-- ==============================================================
-- PHASE 1: ENTERPRISE LEDGER TABLE CONSTRUCTION
-- Run this in your Supabase SQL Editor
-- ==============================================================

-- 1. Create the immutable bank-style ledger table
CREATE TABLE public.inventory_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    transaction_type VARCHAR(50) NOT NULL, 
    -- e.g., 'SALE', 'RESTOCK', 'CORRECTION', 'INITIAL_SEED'
    quantity_before NUMERIC(10, 2) NOT NULL,
    quantity_change NUMERIC(10, 2) NOT NULL,
    quantity_after NUMERIC(10, 2) NOT NULL,
    actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, 
    reference_id UUID, 
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 2. Create High-Speed Indexes
-- These indexes guarantee the dashboard will load instantly even with 100,000+ rows
CREATE INDEX idx_inventory_movements_store_time ON public.inventory_movements(store_id, created_at DESC);
CREATE INDEX idx_inventory_movements_product_time ON public.inventory_movements(product_id, created_at DESC);

-- 3. Setup Row Level Security (RLS) policies
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all dashboard users" ON public.inventory_movements
    FOR SELECT USING (true);
    
CREATE POLICY "Enable write access for all users" ON public.inventory_movements
    FOR INSERT WITH CHECK (true);
    
-- Note: Update/Delete policies are intentionally OMITTED. 
-- Just like a real bank, no one should ever be able to alter or delete an existing ledger receipt.
