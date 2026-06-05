/**
 * ============================================================
 * CASHBOOK — PRODUCT QUERIES
 * ============================================================
 * Backend-owned read queries for the products domain.
 * Pages import from here — they do NOT write inline Supabase calls.
 *
 * BACKEND TEAM: Maintain all product read logic here.
 * FRONTEND TEAM: Do not modify this file.
 * ============================================================
 */

import { supabaseAdmin } from '@/lib/supabase-admin';
import { Product, ProductOption } from '@/lib/types';

/** Retry helper for transient network errors */
async function withRetry<T>(
  queryFn: () => Promise<{ data: T | null; error: any; count?: number | null }>,
  label: string,
  maxAttempts = 3
): Promise<{ data: T | null; error: any; count?: number | null }> {
  let attempts = 0;
  while (attempts < maxAttempts) {
    const res = await queryFn();
    if (!res.error) return res;
    const isNetwork =
      res.error.message?.includes('fetch failed') ||
      res.error.message?.includes('ENOTFOUND') ||
      res.error.code === 'PGRST301';
    if (isNetwork) {
      attempts++;
      const delay = 200 * attempts;
      console.warn(`[queries/products] ${label} retry ${attempts}/${maxAttempts} in ${delay}ms`);
      await new Promise((r) => setTimeout(r, delay));
    } else {
      return res;
    }
  }
  return { data: null, error: new Error(`${label} failed after ${maxAttempts} retries`) };
}

// ─── QUERIES ─────────────────────────────────────────────────

import { unstable_cache } from 'next/cache';

/**
 * Fetches all products for a given store, ordered by name.
 * Returns full product data including prices for admin screens.
 */
export const getProducts = unstable_cache(
  async (storeId: string): Promise<Product[]> => {
    const { data, error } = await withRetry<Product[]>(
      async () =>
        await supabaseAdmin
          .from('products')
          .select('id, store_id, name, unit, quantity, min_quantity, cost_price, selling_price, is_archived, created_at')
          .eq('store_id', storeId)
          .eq('is_archived', false)
          .order('name'),
      'getProducts'
    );
    if (error) console.error('[queries/products] getProducts error:', error.message);
    return data || [];
  },
  ['products'],
  { revalidate: 60, tags: ['products'] }
);

/**
 * Fetches lightweight product data for the manager sales point.
 * Includes stock levels needed for offline validation.
 */
export async function getProductsForSalesPoint(storeId: string): Promise<Product[]> {
  const { data, error } = await withRetry<Product[]>(
    async () =>
      await supabaseAdmin
        .from('products')
        .select('id, store_id, name, unit, quantity, min_quantity, cost_price, selling_price, is_archived, created_at')
        .eq('store_id', storeId)
        .eq('is_archived', false)
        .order('name'),
    'getProductsForSalesPoint'
  );
  if (error) console.error('[queries/products] getProductsForSalesPoint error:', error.message);
  return data || [];
}

/**
 * Fetches minimal product options for dropdowns / pickers.
 */
export async function getProductOptions(storeId: string): Promise<ProductOption[]> {
  const { data, error } = await withRetry<ProductOption[]>(
    async () =>
      await supabaseAdmin
        .from('products')
        .select('id, name')
        .eq('store_id', storeId)
        .eq('is_archived', false)
        .order('name'),
    'getProductOptions'
  );
  if (error) console.error('[queries/products] getProductOptions error:', error.message);
  return data || [];
}

/**
 * Fetches a single product by ID.
 * Returns null if not found or unauthorized.
 */
export async function getProductById(productId: string, storeId: string): Promise<Product | null> {
  const { data, error } = await supabaseAdmin
    .from('products')
    .select('*')
    .eq('id', productId)
    .eq('store_id', storeId)
    .single();
  if (error) console.error('[queries/products] getProductById error:', error.message);
  return data || null;
}

/**
 * Returns the total active (non-archived) product count for a store.
 * Used by billing/plan limit checks.
 */
export const getProductCount = unstable_cache(
  async (storeId: string): Promise<number> => {
    const { count, error } = await supabaseAdmin
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('store_id', storeId)
      .eq('is_archived', false);
    if (error) console.error('[queries/products] getProductCount error:', error.message);
    return count || 0;
  },
  ['products-count'],
  { revalidate: 60, tags: ['products'] }
);
