/**
 * ============================================================
 * CASHBOOK — STORE / BILLING QUERIES
 * ============================================================
 * Backend-owned read queries for stores, billing, and ledger.
 *
 * BACKEND TEAM: Maintain all store/billing read logic here.
 * FRONTEND TEAM: Do not modify this file.
 * ============================================================
 */

import { supabaseAdmin } from '@/lib/supabase-admin';
import { Store, BillingUsage, InventoryMovement, TenantSubscription } from '@/lib/types';
import { getProductCount } from './products';
import { getStaffCount } from './staff';
import { unstable_cache } from 'next/cache';

// ─── QUERIES ─────────────────────────────────────────────────

/**
 * Fetches store details by slug.
 */
export const getStoreBySlug = unstable_cache(
  async (slug: string): Promise<Pick<Store, 'id' | 'name' | 'plan'> | null> => {
    const { data, error } = await supabaseAdmin
      .from('stores')
      .select('id, name, plan')
      .eq('slug', slug)
      .single();
    if (error) console.error('[queries/store] getStoreBySlug error:', error.message);
    return data || null;
  },
  ['store-by-slug'],
  { revalidate: 60, tags: ['store'] }
);

/**
 * Fetches store meta (plan + billing exemption) by ID.
 */
export const getStoreMeta = unstable_cache(
  async (storeId: string): Promise<Pick<Store, 'plan' | 'is_billing_exempt' | 'name'> | null> => {
    const { data, error } = await supabaseAdmin
      .from('stores')
      .select('name, plan, is_billing_exempt')
      .eq('id', storeId)
      .single();
    if (error) console.error('[queries/store] getStoreMeta error:', error.message);
    return data || null;
  },
  ['store-meta'],
  { revalidate: 60, tags: ['store'] }
);

/**
 * Fetches subscription record for a store.
 */
export const getSubscription = unstable_cache(
  async (storeId: string): Promise<TenantSubscription | null> => {
    const { data, error } = await supabaseAdmin
      .from('tenant_subscriptions')
      .select('*')
      .eq('store_id', storeId)
      .single();
    if (error && error.code !== 'PGRST116') {
      console.error('[queries/store] getSubscription error:', error.message);
    }
    return data || null;
  },
  ['store-subscription'],
  { revalidate: 60, tags: ['billing'] }
);

/**
 * Fetches billing usage stats (product count + staff count) for a store.
 */
export async function getBillingUsage(storeId: string): Promise<BillingUsage> {
  const [products, staff] = await Promise.all([
    getProductCount(storeId),
    getStaffCount(storeId),
  ]);
  return { products, staff };
}

/**
 * Fetches the full data needed for the billing page.
 */
export async function getBillingPageData(storeSlug: string): Promise<{
  store: Pick<Store, 'id' | 'name' | 'plan'> | null;
  subscription: TenantSubscription | null;
  usage: BillingUsage;
  error: string | null;
}> {
  const store = await getStoreBySlug(storeSlug);
  if (!store) {
    return { store: null, subscription: null, usage: { products: 0, staff: 0 }, error: 'Store not found' };
  }

  const [subscription, usage] = await Promise.all([
    getSubscription(store.id),
    getBillingUsage(store.id),
  ]);

  return { store, subscription, usage, error: null };
}

/**
 * Fetches inventory movement ledger data for a store.
 * Returns products list for dropdown + transactions for the ledger table.
 */
export async function getLedgerData(storeSlug: string): Promise<{
  products: { id: string; name: string }[];
  transactions: InventoryMovement[];
  error: string | null;
}> {
  const { data: store, error: storeErr } = await supabaseAdmin
    .from('stores')
    .select('id, name')
    .eq('slug', storeSlug)
    .single();

  if (storeErr || !store) {
    return { products: [], transactions: [], error: 'Store not found' };
  }

  const [productsRes, transactionsRes] = await Promise.all([
    supabaseAdmin
      .from('products')
      .select('id, name')
      .eq('store_id', store.id)
      .eq('is_archived', false)
      .order('name', { ascending: true }),

    supabaseAdmin
      .from('inventory_movements')
      .select(`
        *,
        products (name, unit),
        users:actor_id (full_name)
      `)
      .eq('store_id', store.id)
      .order('created_at', { ascending: false })
      .limit(250),
  ]);

  if (transactionsRes.error) {
    console.error('[queries/store] getLedgerData transactions error:', transactionsRes.error.message);
  }

  return {
    products: productsRes.data || [],
    transactions: (transactionsRes.data || []) as InventoryMovement[],
    error: null,
  };
}
