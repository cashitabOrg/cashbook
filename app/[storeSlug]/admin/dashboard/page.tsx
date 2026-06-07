import { requireRole } from "@/lib/auth";
import AdminDashboardClient from "@/components/admin/AdminDashboardClient";
import { getAdminDashboardData } from "@/lib/queries/dashboard";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug: _storeSlug } = await params;
  const userRole = await requireRole(["admin", "super_admin"]);

  // Only fetch dashboard overview data on the server.
  // Ledger/movement data is fetched client-side by LedgerClient to avoid
  // the Turbopack RSC serialization crash ("Cannot read properties of undefined (reading 'stack')").
  const dashboardData = await getAdminDashboardData(userRole.storeId);

  const {
    products,
    rawSessions,
    rawSaleItems,
    recentAdjustments,
    store,
    staffCount,
  } = dashboardData;

  return (
    <div className="lg:p-8 max-w-full mx-auto pb-24">
      <AdminDashboardClient
        storeId={userRole.storeId as string}
        initialProducts={JSON.parse(JSON.stringify(products || []))}
        rawSessions={JSON.parse(JSON.stringify(rawSessions || []))}
        rawSaleItems={JSON.parse(JSON.stringify(rawSaleItems || []))}
        recentAdjustments={JSON.parse(JSON.stringify(recentAdjustments || []))}
        title="Operational Hub"
        subtitle="A real-time overview of your store's lifetime revenue, inventory health, and audit movement logs."
        plan={store?.plan || 'free'}
        isExempt={store?.is_billing_exempt || false}
        staffCount={staffCount || 0}
      />
    </div>
  );
}
