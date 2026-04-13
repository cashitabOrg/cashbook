import AdminProductsClient from "@/components/admin/AdminProductsClient";
import { requireRole } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;
  const userRole = await requireRole(["admin", "super_admin"]);
  const supabase = supabaseAdmin;

  // 1. Fetch store plan
  const { data: store } = await supabase
    .from("stores")
    .select("plan, is_billing_exempt")
    .eq("id", userRole.storeId)
    .single();

  // Fetch products exclusively for this store
  const { data: products, error } = await supabase
    .from("products")
    .select("*")
    .eq("store_id", userRole.storeId)
    .order("name");

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 text-red-700 p-4 rounded-md">
          Failed to load products: {error.message}
        </div>
      </div>
    );
  }

  return (
    <AdminProductsClient 
      storeSlug={storeSlug} 
      products={products || []} 
      plan={store?.plan || 'free'}
      isExempt={store?.is_billing_exempt || false}
    />
  );
}
