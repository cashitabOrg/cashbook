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

  // 1. Fetch products for inventory table
  const { data: products } = await supabase
    .from("products")
    .select("id, name, quantity, min_quantity, unit, cost_price, selling_price")
    .eq("store_id", userRole.storeId)
    .order("name");

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
  
  // Normalize the data for the client component
  const normalizedSaleItems = (rawSaleItems || []).map((item: any) => ({
    ...item,
    products: Array.isArray(item.products) ? item.products[0] : item.products
  }));

  return (
    <div className="lg:p-8 max-w-full mx-auto pb-24">
      <AdminDashboardClient 
        storeId={userRole.storeId as string}
        initialProducts={products || []}
        rawSessions={rawSessions || []}
        rawSaleItems={normalizedSaleItems as any}
        title="Store Performance Hub"
        subtitle="A real-time overview of your lifetime revenue, inventory health, and core business metrics."
      />
    </div>
  );
}
