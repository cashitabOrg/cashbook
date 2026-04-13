-- ==============================================================
-- HOTFIX: FIXING THE STAFF PROFILE LINKING BUG
-- Run this in your Supabase SQL Editor
-- ==============================================================

-- 1. Drop the incorrect foreign key that pointed to the hidden auth table
ALTER TABLE public.inventory_movements 
DROP CONSTRAINT IF EXISTS inventory_movements_actor_id_fkey;

-- 2. Create the correct foreign key pointing to the public Users table so React can read it
ALTER TABLE public.inventory_movements
ADD CONSTRAINT inventory_movements_actor_id_fkey
FOREIGN KEY (actor_id) REFERENCES public.users(id) ON DELETE SET NULL;
