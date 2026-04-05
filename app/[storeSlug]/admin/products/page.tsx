import { createClient } from "@/lib/supabase-server";
import AdminProductsClient from "@/components/admin/AdminProductsClient";
import { requireRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;
  const userRole = await requireRole(["admin", "super_admin"]);
  const supabase = await createClient();

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
    <AdminProductsClient storeSlug={storeSlug} products={products || []} />
  );
}
