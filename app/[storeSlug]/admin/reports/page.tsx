import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireRole } from "@/lib/auth";
import ReportsClient from "@/components/admin/ReportsClient";
import { format, parseISO } from "date-fns";

export const dynamic = "force-dynamic";

export default async function ReportsPage({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;
  const userRole = await requireRole(["admin", "super_admin"]);
  // Use supabaseAdmin to bypass RLS — safe in a server component
  const supabase = supabaseAdmin;

  // 1. Fetch Store details
  const { data: store } = await supabase
    .from("stores")
    .select("name")
    .eq("id", userRole.storeId)
    .single();

  // 2. Fetch Sales Data
  // We need item details joined with product names and session details (manager, date)
  // sale_items -> sales_sessions (manager_id -> users.full_name, started_at)
  // sale_items -> products (name)
  
  const { data: salesRaw, error: salesError } = await supabase
    .from("sale_items")
    .select(`
      id,
      quantity,
      subtotal,
      unit_price,
      unit_cost,
      created_at,
      products (name),
      sales_sessions!inner (
        id,
        started_at,
        status,
        approval_status,
        users!manager_id (full_name)
      )
    `)
    .eq("store_id", userRole.storeId)
    .eq("sales_sessions.status", "closed")
    .order("created_at", { ascending: true });

  if (salesError) {
    console.error('[Reports] Failed to load sales data:', salesError.message, salesError);
    return <div className="p-8 text-red-600">Error loading sales data: {salesError.message}</div>;
  }

  // De-duplicate: Join might return multiple rows per sale_item if relations are duplicated
  const uniqueSalesMap = new Map();
  (salesRaw || []).forEach(item => {
    if (!uniqueSalesMap.has(item.id)) {
      uniqueSalesMap.set(item.id, item);
    }
  });
  const uniqueSales = Array.from(uniqueSalesMap.values());

  const salesData = uniqueSales.map((sale) => {
    const sessionRaw = sale.sales_sessions;
    const session = Array.isArray(sessionRaw) ? sessionRaw[0] : sessionRaw;
    const timestamp = sale.created_at || session?.started_at || new Date().toISOString();
    return {
      id: sale.id,
      timestamp,
      dateStr: format(parseISO(timestamp), "MMM do, yyyy HH:mm"),
      // @ts-ignore
      managerName: session?.users?.full_name || "Unknown Manager",
      // @ts-ignore
      productName: sale.products?.name || "Unknown Product",
      qty: Number(sale.quantity),
      price: Number(sale.unit_price || (Number(sale.subtotal) / Number(sale.quantity))), 
      revenue: Number(sale.subtotal),
      cost: Number(sale.unit_cost || 0),
      profit: Number(sale.subtotal) - (Number(sale.quantity) * Number(sale.unit_cost || 0)),
      sessionId: session?.id,
      approvalStatus: session?.approval_status || 'pending',
    };
  });

  // 3. Fetch Stock-In Data
  const { data: stockRaw, error: stockError } = await supabase
    .from("stock_additions")
    .select(`
      id,
      quantity_added,
      unit_cost,
      note,
      created_at,
      products (name),
      users (full_name)
    `)
    .eq("store_id", userRole.storeId)
    .order("created_at", { ascending: true });

  if (stockError) {
    console.error('[Reports] Failed to load stock data:', stockError.message, stockError);
    return <div className="p-8 text-red-600">Error loading stock data: {stockError.message}</div>;
  }

  const stockData = (stockRaw || []).map((stock) => {
    const timestamp = stock.created_at || new Date().toISOString();
    return {
      id: stock.id,
      timestamp,
      dateStr: format(parseISO(timestamp), "MMM do, yyyy HH:mm"),
      // @ts-ignore
      productName: stock.products?.name || "Unknown Product",
      qtyAdded: Number(stock.quantity_added),
      unitCost: Number(stock.unit_cost || 0),
      totalCost: Number(stock.quantity_added) * Number(stock.unit_cost || 0),
      // @ts-ignore
      addedBy: stock.users?.full_name || "Unknown Admin",
      note: stock.note,
    };
  });

  // 4. Fetch Stock Adjustments
  let { data: adjRaw, error: adjError } = await supabase
    .from("stock_adjustments")
    .select(`
      id,
      quantity_change,
      reason,
      note,
      created_at,
      products (name),
      users (full_name)
    `)
    .eq("store_id", userRole.storeId)
    .order("created_at", { ascending: true });

  if (adjError) {
    console.error('[Reports] Primary adjustment load failed:', adjError.message);
    
    // Safety Fallback: Load data without the name join to prevent page crash
    const { data: fallbackAdj, error: fallbackError } = await supabase
      .from("stock_adjustments")
      .select(`
        id,
        quantity_change,
        reason,
        note,
        created_at,
        products (name)
      `)
      .eq("store_id", userRole.storeId)
      .order("created_at", { ascending: true });
    
    if (fallbackError) {
      console.error('[Reports] Total adjustment failure:', fallbackError.message);
    } else {
      // Map it manually so the UI still shows the data with an 'Admin' label
      adjRaw = (fallbackAdj as any[]).map(a => ({
        ...a,
        users: { full_name: 'Admin' }
      }));
    }
  }

  const adjustmentData = (adjRaw || []).map((adj) => {
    const timestamp = adj.created_at || new Date().toISOString();
    return {
      id: adj.id,
      timestamp,
      dateStr: format(parseISO(timestamp), "MMM do, yyyy HH:mm"),
      // @ts-ignore
      productName: adj.products?.name || "Unknown Product",
      qtyChange: Number(adj.quantity_change),
      reason: adj.reason || "Adjustment",
      // @ts-ignore
      adjustedBy: adj.users?.full_name || "Admin",
      note: adj.note,
    };
  });

  return (
    <div className="lg:p-8 max-w-full mx-auto h-[calc(100vh-3.5rem)] flex flex-col">
      <div className="flex-1 min-h-0">
        <ReportsClient
          storeId={userRole.storeId}
          storeName={store?.name || "Store"}
          salesData={salesData}
          stockData={stockData}
          adjustmentData={adjustmentData}
        />
      </div>
    </div>
  );
}
