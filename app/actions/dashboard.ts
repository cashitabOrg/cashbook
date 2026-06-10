"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";

export type DashboardSaleItem = {
  product_id: string;
  quantity: number;
  subtotal: number;
  created_at: string;
  products: { name: string } | null;
};

export type DashboardSession = {
  total_revenue: number;
  started_at: string;
};

/**
 * Fetches sale items for a specific date range for the admin dashboard.
 * Called client-side when the user changes the date filter.
 * Bypasses the unstable_cache so results are always fresh for the requested window.
 */
export async function fetchDashboardSaleItemsByRange(
  storeId: string,
  startDate: string,
  endDate: string
): Promise<DashboardSaleItem[]> {
  if (!storeId || !startDate || !endDate) return [];

  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  const { data, error } = await supabaseAdmin
    .from("sale_items")
    .select("product_id, quantity, subtotal, created_at, is_deleted, products(name)")
    .eq("store_id", storeId)
    .gte("created_at", start.toISOString())
    .lte("created_at", end.toISOString())
    .order("created_at", { ascending: false })
    .limit(3000);

  if (error) {
    console.error("[actions/dashboard] fetchDashboardSaleItemsByRange:", error.message);
    return [];
  }

  return (data || [])
    .filter((item: any) => !item.is_deleted)
    .map((item: any) => ({
      ...item,
      products: Array.isArray(item.products) ? item.products[0] : item.products,
    }));
}

/**
 * Fetches closed sessions for a specific date range for the admin dashboard.
 * Paired with fetchDashboardSaleItemsByRange for revenue calculations.
 */
export async function fetchDashboardSessionsByRange(
  storeId: string,
  startDate: string,
  endDate: string
): Promise<DashboardSession[]> {
  if (!storeId || !startDate || !endDate) return [];

  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  const { data, error } = await supabaseAdmin
    .from("sales_sessions")
    .select("total_revenue, started_at")
    .eq("store_id", storeId)
    .eq("status", "closed")
    .gte("started_at", start.toISOString())
    .lte("started_at", end.toISOString())
    .order("started_at", { ascending: false })
    .limit(2000);

  if (error) {
    console.error("[actions/dashboard] fetchDashboardSessionsByRange:", error.message);
    return [];
  }

  return (data || []).map((s: any) => ({
    total_revenue: Number(s.total_revenue || 0),
    started_at: s.started_at,
  }));
}
