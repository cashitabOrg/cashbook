-- =========================================================================
-- FrozenPOS Supabase Initialization Script
-- =========================================================================

-- 1. Custom Types / Enums (Idempotent)
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'manager');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE session_status AS ENUM ('open', 'closed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE store_plan AS ENUM ('free', 'basic', 'premium');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- =========================================================================
-- 2. Tables
-- =========================================================================

-- STORES
CREATE TABLE IF NOT EXISTS stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    plan store_plan DEFAULT 'free',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- USERS (Profile table linked to auth.users)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    username TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role user_role NOT NULL,
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE, -- null for super_admin
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PRODUCTS
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    unit TEXT, -- e.g., 'kg', 'pcs', 'carton'
    quantity NUMERIC DEFAULT 0 NOT NULL,
    min_quantity NUMERIC DEFAULT 10 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- STOCK ADDITIONS (Audit trail for when Admin adds stock)
CREATE TABLE IF NOT EXISTS stock_additions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    quantity_added NUMERIC NOT NULL,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SALES SESSIONS
CREATE TABLE IF NOT EXISTS sales_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    manager_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status session_status DEFAULT 'open' NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    total_revenue NUMERIC DEFAULT 0
);

-- SALE ITEMS (Individual items sold during a session)
CREATE TABLE IF NOT EXISTS sale_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES sales_sessions(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    quantity NUMERIC NOT NULL,
    subtotal NUMERIC NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =========================================================================
-- 3. Indexes
-- =========================================================================
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_store_id ON users(store_id);
CREATE INDEX IF NOT EXISTS idx_products_store_id ON products(store_id);
CREATE INDEX IF NOT EXISTS idx_sales_sessions_store_id ON sales_sessions(store_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_session_id ON sale_items(session_id);

-- =========================================================================
-- 4. Row Level Security (RLS)
-- =========================================================================
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_additions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;

-- Note: We assume that the service_role key will bypass RLS for super_admin actions.

-- Users can see their own data, and admins/managers can see users in their store.
-- To avoid recursion, we use SECURITY DEFINER functions for lookup.

CREATE OR REPLACE FUNCTION get_my_role()
RETURNS user_role AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION get_my_store_id()
RETURNS UUID AS $$
  SELECT store_id FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- Users Table Policies
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Explicitly drop legacy policies to prevent recursion if they exist from old script
DROP POLICY IF EXISTS "Users can view users in same store" ON users;
DROP POLICY IF EXISTS "Users can view self" ON users;
CREATE POLICY "Users can view self" ON users FOR SELECT USING (id = auth.uid());

DROP POLICY IF EXISTS "Super admin can view all users" ON users;
CREATE POLICY "Super admin can view all users" ON users FOR SELECT USING (get_my_role() = 'super_admin');

DROP POLICY IF EXISTS "Managers and admins can view same store users" ON users;
CREATE POLICY "Managers and admins can view same store users" ON users FOR SELECT USING (store_id = get_my_store_id());

DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (id = auth.uid());

-- Store visibility: Users can only see their own store
ALTER TABLE stores DISABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own store" ON stores;
CREATE POLICY "Users can view own store" ON stores FOR SELECT USING (
    id = get_my_store_id() OR get_my_role() = 'super_admin'
);

-- Products: Admins and managers can read/write products in their store
DROP POLICY IF EXISTS "Store Isolation: Products SELECT" ON products;
CREATE POLICY "Store Isolation: Products SELECT" ON products FOR SELECT USING (store_id = get_my_store_id());

DROP POLICY IF EXISTS "Store Isolation: Products INSERT" ON products;
CREATE POLICY "Store Isolation: Products INSERT" ON products FOR INSERT WITH CHECK (store_id = get_my_store_id());

DROP POLICY IF EXISTS "Store Isolation: Products UPDATE" ON products;
CREATE POLICY "Store Isolation: Products UPDATE" ON products FOR UPDATE USING (store_id = get_my_store_id());

DROP POLICY IF EXISTS "Store Isolation: Products DELETE" ON products;
CREATE POLICY "Store Isolation: Products DELETE" ON products FOR DELETE USING (store_id = get_my_store_id());

-- Stock Additions
DROP POLICY IF EXISTS "Store Isolation: Stock SELECT" ON stock_additions;
CREATE POLICY "Store Isolation: Stock SELECT" ON stock_additions FOR SELECT USING (store_id = get_my_store_id());

DROP POLICY IF EXISTS "Store Isolation: Stock INSERT" ON stock_additions;
CREATE POLICY "Store Isolation: Stock INSERT" ON stock_additions FOR INSERT WITH CHECK (store_id = get_my_store_id());

-- Sales Sessions
DROP POLICY IF EXISTS "Store Isolation: Sessions SELECT" ON sales_sessions;
CREATE POLICY "Store Isolation: Sessions SELECT" ON sales_sessions FOR SELECT USING (store_id = get_my_store_id());

DROP POLICY IF EXISTS "Store Isolation: Sessions INSERT" ON sales_sessions;
CREATE POLICY "Store Isolation: Sessions INSERT" ON sales_sessions FOR INSERT WITH CHECK (store_id = get_my_store_id());

DROP POLICY IF EXISTS "Store Isolation: Sessions UPDATE" ON sales_sessions;
CREATE POLICY "Store Isolation: Sessions UPDATE" ON sales_sessions FOR UPDATE USING (store_id = get_my_store_id());

-- Sale Items
DROP POLICY IF EXISTS "Store Isolation: Sale Items SELECT" ON sale_items;
CREATE POLICY "Store Isolation: Sale Items SELECT" ON sale_items FOR SELECT USING (store_id = get_my_store_id());

DROP POLICY IF EXISTS "Store Isolation: Sale Items INSERT" ON sale_items;
CREATE POLICY "Store Isolation: Sale Items INSERT" ON sale_items FOR INSERT WITH CHECK (store_id = get_my_store_id());

-- =========================================================================
-- 5. Helper Functions & Triggers
-- =========================================================================

-- Trigger function to automatically deduct product stock when a sale item is inserted
CREATE OR REPLACE FUNCTION deduct_stock()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE products
    SET quantity = quantity - NEW.quantity,
        updated_at = NOW()
    WHERE id = NEW.product_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_deduct_stock ON sale_items;
CREATE TRIGGER trigger_deduct_stock
AFTER INSERT ON sale_items
FOR EACH ROW
EXECUTE FUNCTION deduct_stock();

-- Automatically create public profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, username, full_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'full_name', 'New User'),
    'admin' -- Default role for first person in store
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =========================================================================
-- 6. Super Admin Seed
-- =========================================================================
-- Instructions: Supabase Auth requires user creation through their API normally, 
-- but we can seed it directly into the custom schema 'users' table using a function.
-- However, we must first create the user in GoTrue (auth.users). 
-- DO NOT modify the password hash here unless you know what you are doing. The 
-- secure way is to use the `CREATE USER` endpoint or Supabase CLI, but for seeding:

-- Run these specifically in Supabase SQL editor:
DO $$
DECLARE
    new_user_id UUID := gen_random_uuid();
    existing_user_id UUID;
BEGIN
    -- Check if user already exists in auth.users
    SELECT id INTO existing_user_id FROM auth.users WHERE email = 'taiwodeveop@gmail.com';

    IF existing_user_id IS NULL THEN
        -- Insert into auth.users
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', new_user_id, 'authenticated', 'authenticated', 'taiwodeveop@gmail.com', crypt('Sammyta@iwo1', gen_salt('bf')), NOW(), NULL, NULL, '{"provider":"email","providers":["email"]}', '{"full_name":"Taiwo", "username":"taiwox1"}', NOW(), NOW(), '', '', '', ''
        );
        
        -- Insert into public.users (Trigger might handle this, but explicit insert here is fine too)
        INSERT INTO public.users (
            id, email, username, full_name, role, store_id
        ) VALUES (
            new_user_id, 'taiwodeveop@gmail.com', 'taiwox1', 'Taiwo', 'super_admin', NULL
        ) ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;

-- =========================================================================
-- 7. Realtime Synchronization Settings
-- =========================================================================
-- Enable realtime updates for the products table so Phase 10 (channels) works globally
DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE products;
EXCEPTION WHEN duplicate_object THEN null; WHEN undefined_object THEN null; END $$;
