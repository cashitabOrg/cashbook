import { requireRole } from "@/lib/auth";
import SalesPointUI from "@/components/manager/SalesPointUI";
import { getProductsForSalesPoint } from "@/lib/queries/products";

export const dynamic = "force-dynamic";

export default async function SalesPointPage({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;
  const userRole = await requireRole(["manager", "admin", "super_admin"]);

  // Fetch only products belonging to this store using the centralized backend query layer
  const products = await getProductsForSalesPoint(userRole.storeId);

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
