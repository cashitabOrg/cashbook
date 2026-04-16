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
  // 1. Fetch Store details with Retry
  let store: any = null;
  let storeAttempts = 0;
  while (storeAttempts < 2) {
    const { data, error } = await supabase
      .from("stores")
      .select("name, plan, is_billing_exempt")
      .eq("id", userRole.storeId)
      .single();
    if (!error) {
      store = data;
      break;
    }
    if (error.message?.includes('fetch failed')) {
      storeAttempts++;
      await new Promise(r => setTimeout(r, 200 * storeAttempts));
    } else break;
  }

  // 2. Fetch Sales Data with Retry Logic for network stutters
  let salesRaw: any[] | null = null;
  let salesError: any = null;
  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    const response = await supabase
      .from("sale_items")
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
      .eq("store_id", userRole.storeId)
      .eq("sales_sessions.status", "closed")
      .order("created_at", { ascending: true });

    if (!response.error) {
      salesRaw = response.data;
      salesError = null;
      break;
    }

    salesError = response.error;
    const isNetworkError = salesError.message?.includes('fetch failed') || 
                           salesError.message?.includes('ENOTFOUND') ||
                           salesError.code === 'PGRST301';

    if (isNetworkError) {
      attempts++;
      const delay = 300 * attempts;
      console.warn(`[Reports] Network glitch (Attempt ${attempts}/${maxAttempts}). Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    } else {
      break;
    }
  }

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
      isDeleted: sale.is_deleted || false,
    };
  });

  return (
    <div className="lg:p-8 max-w-full mx-auto h-[calc(100vh-3.5rem)] flex flex-col">
      <div className="flex-1 min-h-0">
        <ReportsClient
          storeId={userRole.storeId}
          storeName={store?.name || "Store"}
          plan={store?.plan || 'free'}
          isBillingExempt={store?.is_billing_exempt || false}
          salesData={salesData}
        />
      </div>
    </div>
  );
}
