import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireRole } from "@/lib/auth";
import ReportsClient from "@/components/admin/ReportsClient";
import { format, parseISO } from "date-fns";

export const dynamic = "force-dynamic";

export default async function ReportsPage({
  params,
}: {
  params: { storeSlug: string };
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
      products (name),
      sales_sessions!inner (
        started_at,
        users!manager_id (full_name)
      )
    `)
    .eq("store_id", userRole.storeId);

  if (salesError) {
    console.error('[Reports] Failed to load sales data:', salesError.message, salesError);
    return <div className="p-8 text-red-600">Error loading sales data: {salesError.message}</div>;
  }

  const salesData = (salesRaw || []).map((sale) => {
    // @ts-ignore
    const session = sale.sales_sessions;
    const timestamp = session?.started_at || new Date().toISOString();
    return {
      id: sale.id,
      timestamp,
      dateStr: format(parseISO(timestamp), "MMM do, yyyy HH:mm"),
      // @ts-ignore
      managerName: session?.users?.full_name || "Unknown Manager",
      // @ts-ignore
      productName: sale.products?.name || "Unknown Product",
      qty: Number(sale.quantity),
      price: 0, // No longer tracked per field, available via subtotal/quantity if needed
      revenue: Number(sale.subtotal),
    };
  });

  // 3. Fetch Stock-In Data
  const { data: stockRaw, error: stockError } = await supabase
    .from("stock_additions")
    .select(`
      id,
      quantity_added,
      note,
      created_at,
      products (name),
      users (full_name)
    `)
    .eq("store_id", userRole.storeId)
    .order("created_at", { ascending: false });

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
      // @ts-ignore
      addedBy: stock.users?.full_name || "Unknown Admin",
      note: stock.note,
    };
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto h-[calc(100vh-3.5rem)] flex flex-col">
      <div className="mb-6 shrink-0">
        <h1 className="text-2xl font-bold leading-7 text-slate-900 sm:truncate sm:text-3xl sm:tracking-tight">
          Store Reports
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Analyze your sales performance and track inventory replenishments. Export to PDF for offline records.
        </p>
      </div>

      <div className="flex-1 min-h-0">
        <ReportsClient
          storeName={store?.name || "Store"}
          salesData={salesData}
          stockData={stockData}
        />
      </div>
    </div>
  );
}
