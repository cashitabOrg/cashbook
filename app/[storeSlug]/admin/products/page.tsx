import AdminProductsClient from "@/components/admin/AdminProductsClient";
import { requireRole } from "@/lib/auth";
import { getProducts } from "@/lib/queries/products";
import { getStoreMeta } from "@/lib/queries/store";
import { getReportSalesData } from "@/lib/queries/sales";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;
  const userRole = await requireRole(["admin", "super_admin"]);

  // Fetch store details, catalog products, and daily sales reports in parallel
  const [store, products, salesRes] = await Promise.all([
    getStoreMeta(userRole.storeId),
    getProducts(userRole.storeId),
    getReportSalesData(userRole.storeId),
  ]);

  return (
    <AdminProductsClient 
      storeId={userRole.storeId}
      storeName={store?.name || "Store"}
      storeSlug={storeSlug} 
      products={products || []} 
      salesData={salesRes?.data || []}
      plan={store?.plan || 'free'}
      isExempt={store?.is_billing_exempt || false}
    />
  );
}
