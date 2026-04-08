import { createClient } from "@/lib/supabase-server";
import { requireRole } from "@/lib/auth";
import SalesPointUI from "@/components/manager/SalesPointUI";

export const dynamic = "force-dynamic";

export default async function SalesPointPage({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;
  const userRole = await requireRole(["manager", "admin", "super_admin"]);
  const supabase = await createClient();

  // Fetch only products belonging to this store
  const { data: products, error } = await supabase
    .from("products")
    .select("id, store_id, name, unit, quantity, min_quantity, cost_price, selling_price")
    .eq("store_id", userRole.storeId)
    .order("name");

  if (error) {
    console.error("[SalesPointPage] Error fetching products:", error);
  }

  return (
    <div className="h-full flex flex-col">
      <SalesPointUI 
        storeSlug={storeSlug} 
        storeId={userRole.storeId as string}
        managerId={userRole.id}
        initialProducts={products || []} 
      />
    </div>
  );
}

