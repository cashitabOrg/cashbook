import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireRole } from "@/lib/auth";
import ManagerHistoryClient from "@/components/manager/ManagerHistoryClient";
import { History } from "lucide-react";
import { toLagosDateString } from "@/lib/date-utils";

export const dynamic = "force-dynamic";

export default async function ManagerHistoryPage({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;
  const userRole = await requireRole(["manager", "admin", "super_admin"]);
  // Use supabaseAdmin to bypass RLS — safe in a server component
  const supabase = supabaseAdmin;

  // Resilient Fetch Helper — handles transient "TypeError: fetch failed" network glitches
  async function fetchWithRetry<T>(queryFn: () => PromiseLike<{ data: T | null; error: any }> | any, label: string) {
    let attempts = 0;
    const maxAttempts = 3;
    while (attempts < maxAttempts) {
      const { data, error } = await queryFn();
      if (!error) return { data, error: null };
      const isNetworkError =
        error.message?.includes('fetch failed') ||
        error.message?.includes('ENOTFOUND') ||
        error.code === 'PGRST301';
      if (isNetworkError) {
        attempts++;
        const delay = 300 * attempts;
        console.warn(`[ManagerHistory] ${label} glitch (${attempts}/${maxAttempts}). Retrying in ${delay}ms...`);
        await new Promise((r) => setTimeout(r, delay));
      } else {
        return { data: null, error };
      }
    }
    return { data: null, error: { message: `Failed after ${maxAttempts} retries.` } };
  }

  // 1. Fetch closed sessions for this specific manager
  const { data: sessions, error: sessionsError } = await fetchWithRetry(
    () =>
      supabase
        .from("sales_sessions")
        .select("id, started_at, ended_at, total_revenue, status, approval_status")
        .eq("store_id", userRole.storeId)
        .eq("manager_id", userRole.id)
        .eq("status", "closed")
        .order("started_at", { ascending: false }),
    "fetchSessions"
  );

  if (sessionsError) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="bg-rose-50 border border-rose-100 text-rose-700 p-6 rounded-2xl shadow-sm text-center">
          <p className="font-bold text-sm mb-1">Could not load history</p>
          <p className="text-xs opacity-60">{sessionsError.message}</p>
          <p className="text-xs mt-3 text-slate-500">Try refreshing the page.</p>
        </div>
      </div>
    );
  }

  // If no sessions, short circuit
  if (!sessions || sessions.length === 0) {
    return (
      <div className="lg:p-8 max-w-full mx-auto pb-24 px-4 lg:px-0">
        <div className="mb-8">
          <h1 className="text-2xl font-bold leading-7 text-slate-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Sales History
          </h1>
        </div>
        <ManagerHistoryClient dailyGroups={[]} />
      </div>
    );
  }

  const sessionIds = sessions.map((s: any) => s.id);

  // 2. Fetch sale_items for those sessions
  const { data: saleItems } = await fetchWithRetry(
    () =>
      supabase
        .from("sale_items")
        .select("id, session_id, product_id, quantity, subtotal, created_at, is_deleted, products(name)")
        .in("session_id", sessionIds),
    "fetchSaleItems"
  );

  // 2.5 Fetch products for swapping in Edit Modal
  const { data: storeProducts } = await fetchWithRetry(
    () =>
      supabase
        .from("products")
        .select("id, name")
        .eq("store_id", userRole.storeId)
        .order("name", { ascending: true }),
    "fetchProducts"
  );
  
  const availableProducts = storeProducts || [];

  // 3. Build structured response
  // Group by date string YYYY-MM-DD
  const dailyGroupsMap: Record<string, any> = {};

  sessions.forEach((session: any) => {
    const dateStr = toLagosDateString(session.ended_at || session.started_at);
    
    if (!dailyGroupsMap[dateStr]) {
      dailyGroupsMap[dateStr] = {
        dateStr,
        sessions: [],
        dailyTotalRevenue: 0,
        dailyTotalItems: 0,
        isFullyApproved: true,
        productBreakdown: {}
      };
    }
    
    if (session.approval_status !== 'approved') {
      dailyGroupsMap[dateStr].isFullyApproved = false;
    }
    
    // Find items for this session
    const sessionItemsData = (saleItems || []).filter((item: any) => item.session_id === session.id);
    const sessionItems = sessionItemsData.map((item: any) => ({
      id: item.id,
      productId: item.product_id,
      // @ts-ignore
      productName: item.products?.name || "Unknown",
      qtySold: Number(item.quantity),
      revenue: Number(item.subtotal),
      createdAt: item.created_at,
      isDeleted: item.is_deleted || false
    }));
    
    // Only count non-deleted items for totals
    const activeItemsCount = sessionItems.reduce((acc: number, curr: any) => acc + (curr.isDeleted ? 0 : curr.qtySold), 0);
    const activeSessionRevenue = sessionItems.reduce((acc: number, curr: any) => acc + (curr.isDeleted ? 0 : curr.revenue), 0);
    
    dailyGroupsMap[dateStr].sessions.push({
      id: session.id,
      startedAt: session.started_at,
      endedAt: session.ended_at,
      totalRevenue: activeSessionRevenue,
      itemsCount: activeItemsCount,
      approvalStatus: session.approval_status || 'pending',
      items: sessionItems
    });
    
    // Update daily totals
    dailyGroupsMap[dateStr].dailyTotalRevenue += activeSessionRevenue;
    dailyGroupsMap[dateStr].dailyTotalItems += activeItemsCount;
    
    // Update daily product breakdown (excluding deleted)
    sessionItems.filter((i: any) => !i.isDeleted).forEach((item: any) => {
      const pid = item.productId;
      if (!dailyGroupsMap[dateStr].productBreakdown[pid]) {
        dailyGroupsMap[dateStr].productBreakdown[pid] = {
          productId: pid,
          productName: item.productName,
          qtySold: 0,
          revenue: 0
        };
      }
      dailyGroupsMap[dateStr].productBreakdown[pid].qtySold += item.qtySold;
      dailyGroupsMap[dateStr].productBreakdown[pid].revenue += item.revenue;
    });
  });

  // Convert map to sorted array (most recent date first)
  const dailyGroupsArray = Object.values(dailyGroupsMap).sort((a, b) => b.dateStr.localeCompare(a.dateStr));

  return (
    <div className="max-w-full mx-auto pb-24">
      <div className="bg-white lg:rounded-xl lg:shadow-sm lg:border border-slate-200 px-4 lg:px-6 py-4 flex items-center justify-between mb-2 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-500/20">
            <History className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm lg:text-xl font-black text-slate-900 tracking-tight leading-none">History</h1>
            <p className="text-[8px] lg:text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Past Sales Sessions</p>
          </div>
        </div>
      </div>

      <div className="px-2 lg:px-0">
        <ManagerHistoryClient 
          dailyGroups={dailyGroupsArray} 
          availableProducts={availableProducts}
        />
      </div>
    </div>
  );
}
