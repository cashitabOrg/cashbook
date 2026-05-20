import AdminProductsClient from "@/components/admin/AdminProductsClient";
import { requireRole } from "@/lib/auth";
import { getProducts } from "@/lib/queries/products";
import { getStoreMeta } from "@/lib/queries/store";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;
  const userRole = await requireRole(["admin", "super_admin"]);

  // 1. Fetch store meta
  const store = await getStoreMeta(userRole.storeId);

  // 2. Fetch products exclusively for this store
  const products = await getProducts(userRole.storeId);

  return (
    <AdminProductsClient 
      storeSlug={storeSlug} 
      products={products || []} 
      plan={store?.plan || 'free'}
      isExempt={store?.is_billing_exempt || false}
    />
  );
}
