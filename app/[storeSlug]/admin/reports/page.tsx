import { requireRole } from "@/lib/auth";
import { getStoreMeta } from "@/lib/queries/store";
import { getReportSalesData } from "@/lib/queries/sales";
import ReportsClient from "@/components/admin/ReportsClient";

export const dynamic = "force-dynamic";

export default async function AdminReportsPage({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;
  const userRole = await requireRole(["admin", "super_admin"]);

  // Fetch store details and reports sales data in parallel
  const [store, salesRes] = await Promise.all([
    getStoreMeta(userRole.storeId),
    getReportSalesData(userRole.storeId),
  ]);

  return (
    <div className="lg:p-8 max-w-full mx-auto space-y-6">
      <ReportsClient 
        storeId={userRole.storeId}
        storeName={store?.name || "Store"}
        plan={store?.plan || 'free'}
        isBillingExempt={store?.is_billing_exempt || false}
        salesData={salesRes?.data || []}
      />
    </div>
  );
}
