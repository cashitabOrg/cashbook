/**
 * ============================================================
 * CASHBOOK — SALES QUERIES
 * ============================================================
 * Backend-owned read queries for the sales domain.
 * Pages import from here — they do NOT write inline Supabase calls.
 *
 * BACKEND TEAM: Maintain all sales read logic here.
 * FRONTEND TEAM: Do not modify this file.
 * ============================================================
 */

import { supabaseAdmin } from '@/lib/supabase-admin';
import { format, parseISO } from 'date-fns';
import { toLagosDateString } from '@/lib/date-utils';
import { unstable_cache } from 'next/cache';
import {
  RawSession,
  RawSaleItem,
  ReportSaleRow,
  DailyHistoryGroup,
  ProductOption,
} from '@/lib/types';
import { getStoreSubscriptionStatus } from '@/lib/planEnforcement';

/** Retry helper for transient network errors.
 * IMPORTANT: queryFn must build a *fresh* Supabase query object on every call.
 * Supabase's PostgrestBuilder caches its internal fetch promise after the first await,
 * so passing the same query object into every retry returns the cached failure.
 */
async function withRetry<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  label: string,
  maxAttempts = 3
): Promise<{ data: T | null; error: any }> {
  let attempts = 0;
  while (attempts < maxAttempts) {
    try {
      const res = await queryFn();
      if (!res.error) return res;
      const isNetwork =
        res.error.message?.includes('fetch failed') ||
        res.error.message?.includes('ENOTFOUND') ||
        res.error.code === 'PGRST301';
      if (isNetwork) {
        attempts++;
        const delay = 300 * attempts;
        console.warn(`[queries/sales] ${label} retry ${attempts}/${maxAttempts} in ${delay}ms`);
        await new Promise((r) => setTimeout(r, delay));
      } else {
        return res; // Non-network error — don't retry
      }
    } catch (thrown: any) {
      // queryFn threw instead of returning { data, error } — treat as network error
      const isNetwork =
        thrown?.message?.includes('fetch failed') ||
        thrown?.message?.includes('ENOTFOUND');
      if (isNetwork && attempts < maxAttempts - 1) {
        attempts++;
        const delay = 300 * attempts;
        console.warn(`[queries/sales] ${label} thrown-retry ${attempts}/${maxAttempts} in ${delay}ms`);
        await new Promise((r) => setTimeout(r, delay));
      } else {
        return { data: null, error: thrown };
      }
    }
  }
  return { data: null, error: new Error(`${label} failed after ${maxAttempts} retries`) };
}

// ─── QUERIES ─────────────────────────────────────────────────


/**
 * Fetches closed sessions for revenue analytics.
 * Used by both admin and manager dashboards.
 */
export const getClosedSessions = unstable_cache(
  async (storeId: string): Promise<RawSession[]> => {
    const subStatus = await getStoreSubscriptionStatus(storeId);

    // Compute date filter once (used inside the retry callback)
    const minDate =
      subStatus.plan === 'starter'
        ? new Date(Date.now() - 90 * 86_400_000).toISOString()
        : subStatus.plan === 'growth'
        ? new Date(Date.now() - 180 * 86_400_000).toISOString()
        : null;

    // Build a FRESH query object inside the callback — Supabase's PostgrestBuilder
    // caches its fetch promise after first await, so each retry needs a new instance.
    const { data, error } = await withRetry<RawSession[]>(
      async () => {
        let q = supabaseAdmin
          .from('sales_sessions')
          .select('total_revenue, started_at')
          .eq('store_id', storeId)
          .eq('status', 'closed')
          .order('started_at', { ascending: false })
          .limit(500);
        if (minDate) q = q.gte('started_at', minDate);
        return await q;
      },
      'getClosedSessions'
    );
    if (error) console.error('[queries/sales] getClosedSessions error:', error.message);
    return data || [];
  },
  ['closed-sessions'],
  { revalidate: 30, tags: ['sales'] }
);

/**
 * Fetches sale items with product names for analytics.
 * Filters out soft-deleted items.
 * Used by admin and manager dashboards for performance charts.
 */
export const getSaleItemsForAnalytics = unstable_cache(
  async (storeId: string): Promise<RawSaleItem[]> => {
    const subStatus = await getStoreSubscriptionStatus(storeId);

    // Compute date filter once (used inside the retry callback)
    const minDate =
      subStatus.plan === 'starter'
        ? new Date(Date.now() - 90 * 86_400_000).toISOString()
        : subStatus.plan === 'growth'
        ? new Date(Date.now() - 180 * 86_400_000).toISOString()
        : null;

    // Build a FRESH query object inside the callback — Supabase's PostgrestBuilder
    // caches its fetch promise after first await, so each retry needs a new instance.
    const { data, error } = await withRetry<any[]>(
      async () => {
        let q = supabaseAdmin
          .from('sale_items')
          .select('product_id, quantity, subtotal, created_at, is_deleted, products(name)')
          .eq('store_id', storeId)
          .order('created_at', { ascending: false })
          .limit(1000);
        if (minDate) q = q.gte('created_at', minDate);
        return await q;
      },
      'getSaleItemsForAnalytics'
    );
    if (error) console.error('[queries/sales] getSaleItemsForAnalytics error:', error.message);

    // Normalize relational join result and filter deleted items
    return (data || [])
      .filter((item: any) => !item.is_deleted)
      .map((item: any) => ({
        ...item,
        products: Array.isArray(item.products) ? item.products[0] : item.products,
      }));
  },
  ['sale-items-analytics'],
  { revalidate: 30, tags: ['sales'] }
);

export async function getReportSalesData(storeId: string): Promise<{
  data: ReportSaleRow[];
  error: string | null;
}> {
    const subStatus = await getStoreSubscriptionStatus(storeId);

    let query = supabaseAdmin
      .from('sale_items')
      .select(`
        id,
        quantity,
        subtotal,
        unit_price,
        unit_cost,
        created_at,
        is_deleted,
        products (name),
        sales_sessions!inner (
          id,
          started_at,
          status,
          approval_status,
          users!manager_id (full_name)
        )
      `)
      .eq('store_id', storeId)
      .eq('sales_sessions.status', 'closed')
      .order('created_at', { ascending: false })
      .limit(500);

    if (subStatus.plan === 'starter') {
      const minDate = new Date();
      minDate.setDate(minDate.getDate() - 90);
      query = query.gte('created_at', minDate.toISOString());
    } else if (subStatus.plan === 'growth') {
      const minDate = new Date();
      minDate.setDate(minDate.getDate() - 180);
      query = query.gte('created_at', minDate.toISOString());
    }

    const { data: salesRaw, error } = await withRetry<any[]>(
      async () => await query,
      'getReportSalesData'
    );

    if (error) {
      return { data: [], error: error.message };
    }

    // De-duplicate join results
    const uniqueSalesMap = new Map<string, any>();
    (salesRaw || []).forEach((item: any) => {
      if (!uniqueSalesMap.has(item.id)) {
        uniqueSalesMap.set(item.id, item);
      }
    });

    const salesData: ReportSaleRow[] = Array.from(uniqueSalesMap.values()).map((sale: any) => {
      const sessionRaw = sale.sales_sessions;
      const session = Array.isArray(sessionRaw) ? sessionRaw[0] : sessionRaw;
      const timestamp = sale.created_at || session?.started_at || new Date().toISOString();
      return {
        id: sale.id,
        timestamp,
        dateStr: format(parseISO(timestamp), 'MMM do, yyyy HH:mm'),
        managerName: session?.users?.full_name || 'Unknown Manager',
        productName: sale.products?.name || 'Unknown Product',
        qty: Number(sale.quantity),
        price: Number(sale.unit_price || Number(sale.subtotal) / Number(sale.quantity)),
        revenue: Number(sale.subtotal),
        cost: Number(sale.unit_cost || 0),
        profit: Number(sale.subtotal) - Number(sale.quantity) * Number(sale.unit_cost || 0),
        sessionId: session?.id,
        approvalStatus: session?.approval_status || 'pending',
        isDeleted: sale.is_deleted || false,
      };
    });

    return { data: salesData, error: null };
}

/**
 * Fetches a manager's closed sessions grouped by day.
 * Used by the manager history page.
 */
export async function getManagerHistory(
  storeId: string,
  managerId: string
): Promise<{
  dailyGroups: DailyHistoryGroup[];
  availableProducts: ProductOption[];
  error: string | null;
}> {
  // 1. Fetch closed sessions for this manager
  const subStatus = await getStoreSubscriptionStatus(storeId);

  const { data: sessions, error: sessionsError } = await withRetry<any[]>(
    async () => {
      let q = supabaseAdmin
        .from('sales_sessions')
        .select('id, started_at, ended_at, total_revenue, status, approval_status')
        .eq('store_id', storeId)
        .eq('manager_id', managerId)
        .eq('status', 'closed')
        .order('started_at', { ascending: false });

      if (subStatus.plan === 'starter') {
        const minDate = new Date();
        minDate.setDate(minDate.getDate() - 90);
        q = q.gte('started_at', minDate.toISOString());
      } else if (subStatus.plan === 'growth') {
        const minDate = new Date();
        minDate.setDate(minDate.getDate() - 180);
        q = q.gte('started_at', minDate.toISOString());
      }
      return await q;
    },
    'getManagerHistory:sessions'
  );

  if (sessionsError) {
    return { dailyGroups: [], availableProducts: [], error: sessionsError.message };
  }

  if (!sessions || sessions.length === 0) {
    return { dailyGroups: [], availableProducts: [], error: null };
  }

  const sessionIds = sessions.map((s: any) => s.id);

  // 2. Fetch sale items for those sessions
  // We order by created_at descending and use a much larger limit (3000) so that
  // the most recent session items are prioritized and not cut off if there is a lot of history.
  const { data: saleItems, error: saleItemsError } = await withRetry<any[]>(
    async () =>
      await supabaseAdmin
        .from('sale_items')
        .select('id, session_id, product_id, quantity, subtotal, created_at, is_deleted, products(name)')
        .in('session_id', sessionIds)
        .order('created_at', { ascending: false })
        .limit(3000),
    'getManagerHistory:saleItems'
  );

  if (saleItemsError) {
    return { dailyGroups: [], availableProducts: [], error: saleItemsError.message };
  }

  // 3. Fetch available products for the edit modal
  const { data: storeProducts, error: productsError } = await withRetry<ProductOption[]>(
    async () =>
      await supabaseAdmin
        .from('products')
        .select('id, name')
        .eq('store_id', storeId)
        .eq('is_archived', false)
        .order('name', { ascending: true }),
    'getManagerHistory:products'
  );

  if (productsError) {
    return { dailyGroups: [], availableProducts: [], error: productsError.message };
  }

  // 4. Group sessions by date
  const dailyGroupsMap: Record<string, DailyHistoryGroup> = {};

  (sessions as any[]).forEach((session: any) => {
    const dateStr = toLagosDateString(session.ended_at || session.started_at);

    if (!dailyGroupsMap[dateStr]) {
      dailyGroupsMap[dateStr] = {
        dateStr,
        sessions: [],
        dailyTotalRevenue: 0,
        dailyTotalItems: 0,
        isFullyApproved: true,
        productBreakdown: {},
      };
    }

    if (session.approval_status !== 'approved') {
      dailyGroupsMap[dateStr].isFullyApproved = false;
    }

    const sessionItemsData = (saleItems || []).filter((item: any) => item.session_id === session.id);
    const sessionItems = sessionItemsData.map((item: any) => ({
      id: item.id,
      productId: item.product_id,
      productName: (item.products as any)?.name || 'Unknown',
      qtySold: Number(item.quantity),
      revenue: Number(item.subtotal),
      createdAt: item.created_at,
      isDeleted: item.is_deleted || false,
    }));

    const activeRevenue = sessionItems.reduce(
      (acc: number, curr: any) => acc + (curr.isDeleted ? 0 : curr.revenue),
      0
    );
    const activeItemCount = sessionItems.reduce(
      (acc: number, curr: any) => acc + (curr.isDeleted ? 0 : curr.qtySold),
      0
    );

    dailyGroupsMap[dateStr].sessions.push({
      id: session.id,
      startedAt: session.started_at,
      endedAt: session.ended_at,
      totalRevenue: activeRevenue,
      itemsCount: activeItemCount,
      approvalStatus: session.approval_status || 'pending',
      items: sessionItems,
    });

    dailyGroupsMap[dateStr].dailyTotalRevenue += activeRevenue;
    dailyGroupsMap[dateStr].dailyTotalItems += activeItemCount;

    sessionItems
      .filter((i: any) => !i.isDeleted)
      .forEach((item: any) => {
        const pid = item.productId;
        if (!dailyGroupsMap[dateStr].productBreakdown[pid]) {
          dailyGroupsMap[dateStr].productBreakdown[pid] = {
            productId: pid,
            productName: item.productName,
            qtySold: 0,
            revenue: 0,
          };
        }
        dailyGroupsMap[dateStr].productBreakdown[pid].qtySold += item.qtySold;
        dailyGroupsMap[dateStr].productBreakdown[pid].revenue += item.revenue;
      });
  });

  const dailyGroups = Object.values(dailyGroupsMap).sort((a, b) =>
    b.dateStr.localeCompare(a.dateStr)
  );

  return {
    dailyGroups,
    availableProducts: storeProducts || [],
    error: null,
  };
}

/**
 * Fetches available session dates for the correction page.
 */
export async function getSessionDates(storeId: string): Promise<string[]> {
  const { data, error } = await supabaseAdmin
    .from('sales_sessions')
    .select('started_at')
    .eq('store_id', storeId)
    .order('started_at', { ascending: false })
    .limit(90);

  if (error) {
    console.error('[queries/sales] getSessionDates error:', error.message);
    return [];
  }

  return Array.from(new Set((data || []).map((s: any) => s.started_at.split('T')[0])))
    .sort()
    .reverse();
}
