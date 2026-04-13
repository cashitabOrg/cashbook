import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireRole } from "@/lib/auth";
import AdminDashboardClient from "@/components/admin/AdminDashboardClient";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;
  const userRole = await requireRole(["admin", "super_admin"]);
  // Use supabaseAdmin to bypass RLS — safe in a server component
  const supabase = supabaseAdmin;

  // 1. Fetch store plan and usage counts
  const { data: store } = await supabase
    .from("stores")
    .select("plan, is_billing_exempt")
    .eq("id", userRole.storeId)
    .single();

  const { data: products } = await supabase
    .from("products")
    .select("id, name, quantity, min_quantity, unit, cost_price, selling_price")
    .eq("store_id", userRole.storeId)
    .order("name");

  const { count: staffCount } = await supabase
    .from("users")
    .select("*", { count: 'exact', head: true })
    .eq("store_id", userRole.storeId);

  // 2. Fetch Sessions for Revenue Data
  const { data: rawSessions, error: sessionsErr } = await supabase
    .from("sales_sessions")
    .select("total_revenue, started_at")
    .eq("store_id", userRole.storeId)
    .eq("status", "closed");
  if (sessionsErr) console.error('[AdminDashboard] sessions error:', sessionsErr.message);

  // 3. Fetch Raw Sale Items for Performance Analytics
  const { data: rawSaleItems, error: itemsErr } = await supabase
    .from("sale_items")
    .select(`
      product_id,
      quantity,
      subtotal,
      created_at,
      products (name)
    `)
    .eq("store_id", userRole.storeId);
  if (itemsErr) console.error('[AdminDashboard] sale_items error:', itemsErr.message);

  const normalizedSaleItems = (rawSaleItems || []).map(item => ({
    ...item,
    products: Array.isArray(item.products) ? item.products[0] : item.products
  }));
  
  // 4. Fetch Recent Stock Adjustments for Dashboard
  let { data: recentAdjustments, error: adjErr } = await supabase
    .from("stock_adjustments")
    .select(`
      id,
      quantity_change,
      reason,
      note,
      created_at,
      products (name),
      users!admin_id (full_name)
    `)
    .eq("store_id", userRole.storeId)
    .order("created_at", { ascending: false })
    .limit(10);
  if (adjErr) {
    // Only log to console if it's NOT a relationship error (which we handle below)
    if (!adjErr.message.includes("relationship")) {
      console.error('[AdminDashboard] adjustments error:', adjErr.message);
    }
    // If it fails with a relationship error, fall back to a simpler fetch without join
    if (adjErr.message.includes("relationship")) {
      const { data: fallbackAdj } = await supabase
        .from("stock_adjustments")
        .select(`id, quantity_change, reason, note, created_at, product_id`)
        .eq("store_id", userRole.storeId)
        .order("created_at", { ascending: false })
        .limit(10);
      
      if (fallbackAdj) {
        // Manually attach product names if the relationship join is failing for some reason
        const productIds = fallbackAdj.map(a => a.product_id);
        const { data: prodNames } = await supabase.from('products').select('id, name').in('id', productIds);
        (recentAdjustments as any) = fallbackAdj.map(a => ({
          ...a,
          products: prodNames?.find(p => p.id === a.product_id) || { name: 'Unknown' },
          users: { full_name: 'Admin' }
        }));
      }
    }
  }

  return (
    <div className="lg:p-8 max-w-full mx-auto pb-24">
      <AdminDashboardClient 
        storeId={userRole.storeId as string}
        initialProducts={products || []}
        rawSessions={rawSessions || []}
        rawSaleItems={normalizedSaleItems as any}
        recentAdjustments={recentAdjustments || []}
        title="Store Performance Hub"
        subtitle="A real-time overview of your lifetime revenue, inventory health, and core business metrics."
        plan={store?.plan || 'free'}
        isExempt={store?.is_billing_exempt || false}
        staffCount={staffCount || 0}
      />
    </div>
  );
}
