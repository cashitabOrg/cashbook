/**
 * ============================================================
 * CASHBOOK — DASHBOARD QUERIES
 * ============================================================
 * Backend-owned read queries that power the admin and manager dashboards.
 * Pages import from here — they do NOT write inline Supabase calls.
 *
 * BACKEND TEAM: Maintain all dashboard read logic here.
 * FRONTEND TEAM: Do not modify this file.
 * ============================================================
 */

import { supabaseAdmin } from '@/lib/supabase-admin';
import { AdminDashboardData, ManagerDashboardData, StockAdjustment, Store } from '@/lib/types';
import { getProducts } from './products';
import { getClosedSessions, getSaleItemsForAnalytics } from './sales';
import { getStaffCount } from './staff';

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
      console.warn(`[queries/dashboard] ${label} retry ${attempts}/${maxAttempts} in ${delay}ms`);
      await new Promise((r) => setTimeout(r, delay));
    } else {
      return res;
    }
  }
  return { data: null, error: new Error(`${label} failed after ${maxAttempts} retries`) };
}

// ─── QUERIES ─────────────────────────────────────────────────

/**
 * Fetches all data required by the Admin Dashboard in parallel.
 * Handles the resilient stock_adjustments fetch with relationship fallback.
 */
export async function getAdminDashboardData(storeId: string): Promise<AdminDashboardData> {
  const [products, rawSessions, rawSaleItems, storeRes, staffCount] = await Promise.all([
    getProducts(storeId),
    getClosedSessions(storeId),
    getSaleItemsForAnalytics(storeId),
    withRetry<Pick<Store, 'plan' | 'is_billing_exempt'>>(
      async () =>
        await supabaseAdmin
          .from('stores')
          .select('plan, is_billing_exempt')
          .eq('id', storeId)
          .single(),
      'store_meta'
    ),
    getStaffCount(storeId),
  ]);

  // Fetch recent stock adjustments with relationship join + fallback
  let recentAdjustments: StockAdjustment[] = [];
  let { data: adjData, error: adjErr } = await supabaseAdmin
    .from('stock_adjustments')
    .select(`
      id,
      quantity_change,
      reason,
      note,
      created_at,
      products (name),
      users!admin_id (full_name)
    `)
    .eq('store_id', storeId)
    .order('created_at', { ascending: false })
    .limit(10);

  if (adjErr?.message?.includes('relationship')) {
    // Fallback: fetch without join and manually attach names
    const { data: fallbackAdj } = await supabaseAdmin
      .from('stock_adjustments')
      .select('id, quantity_change, reason, note, created_at, product_id')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (fallbackAdj) {
      const productIds = fallbackAdj.map((a: any) => a.product_id);
      const { data: prodNames } = await supabaseAdmin
        .from('products')
        .select('id, name')
        .in('id', productIds);
      adjData = fallbackAdj.map((a: any) => ({
        ...a,
        products: prodNames?.find((p: any) => p.id === a.product_id) || { name: 'Unknown' },
        users: { full_name: 'Admin' },
      })) as any;
    }
  } else if (adjErr) {
    console.error('[queries/dashboard] adjustments error:', adjErr.message);
  }

  recentAdjustments = (adjData || []) as unknown as StockAdjustment[];

  return {
    products,
    rawSessions,
    rawSaleItems,
    recentAdjustments,
    store: storeRes.data || null,
    staffCount,
  };
}

/**
 * Fetches all data required by the Manager Dashboard in parallel.
 */
export async function getManagerDashboardData(storeId: string): Promise<ManagerDashboardData> {
  const [products, rawSessions, rawSaleItems] = await Promise.all([
    supabaseAdmin
      .from('products')
      .select('id, name, quantity, min_quantity')
      .eq('store_id', storeId)
      .eq('is_archived', false)
      .order('name')
      .then(({ data, error }) => {
        if (error) console.error('[queries/dashboard] manager products error:', error.message);
        return data || [];
      }),
    getClosedSessions(storeId),
    getSaleItemsForAnalytics(storeId),
  ]);

  return { products, rawSessions, rawSaleItems };
}
