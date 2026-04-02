import { createClient } from "@/lib/supabase-server";
import { requireRole } from "@/lib/auth";
import SalesPointUI from "@/components/manager/SalesPointUI";

export const dynamic = "force-dynamic";

export default async function SalesPointPage({
  params,
}: {
  params: { storeSlug: string };
}) {
  const { storeSlug } = await params;
  const userRole = await requireRole(["manager", "admin", "super_admin"]);
  const supabase = await createClient();

  // Try to fetch available products, but don't crash if offline
  const { data: products, error } = await supabase
    .from("products")
    .select("id, store_id, name, unit, quantity")
    .eq("store_id", userRole.storeId)
    .order("name");

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

