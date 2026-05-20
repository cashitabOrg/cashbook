import { requireRole } from "@/lib/auth";
import ReportsClient from "@/components/admin/ReportsClient";
import { getStoreMeta } from "@/lib/queries/store";
import { getReportSalesData } from "@/lib/queries/sales";

export const dynamic = "force-dynamic";

export default async function ReportsPage({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;
  const userRole = await requireRole(["admin", "super_admin"]);

  // 1. Fetch Store details
  const store = await getStoreMeta(userRole.storeId);

  // 2. Fetch Sales Data with centralized retry logic for network stutters
  const { data: salesData, error: salesError } = await getReportSalesData(userRole.storeId);

  if (salesError) {
    console.error('[Reports] Failed to load sales data:', salesError);
    return <div className="p-8 text-red-600">Error loading sales data: {salesError}</div>;
  }

  return (
    <div className="lg:p-8 max-w-full mx-auto h-[calc(100vh-3.5rem)] flex flex-col">
      <div className="flex-1 min-h-0">
        <ReportsClient
          storeId={userRole.storeId}
          storeName={store?.name || "Store"}
          plan={store?.plan || 'free'}
          isBillingExempt={store?.is_billing_exempt || false}
          salesData={salesData}
        />
      </div>
    </div>
  );
}
