import { requireRole } from "@/lib/auth";
import AdminDashboardClient from "@/components/admin/AdminDashboardClient";
import { getAdminDashboardData } from "@/lib/queries/dashboard";
import { getLedgerData } from "@/lib/queries/store";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;
  const userRole = await requireRole(["admin", "super_admin"]);

  // Fetch both dashboard and ledger movements in parallel for the consolidated workspace
  const [dashboardData, ledgerData] = await Promise.all([
    getAdminDashboardData(userRole.storeId),
    getLedgerData(storeSlug),
  ]);

  const {
    products,
    rawSessions,
    rawSaleItems,
    recentAdjustments,
    store,
    staffCount,
  } = dashboardData;

  const { transactions } = ledgerData;

  return (
    <div className="lg:p-8 max-w-full mx-auto pb-24">
      <AdminDashboardClient 
        storeId={userRole.storeId as string}
        initialProducts={products || []}
        rawSessions={rawSessions || []}
        rawSaleItems={rawSaleItems as any}
        recentAdjustments={recentAdjustments || []}
        transactions={transactions || []}
        title="Operational Hub"
        subtitle="A real-time overview of your store's lifetime revenue, inventory health, and audit movement logs."
        plan={store?.plan || 'free'}
        isExempt={store?.is_billing_exempt || false}
        staffCount={staffCount || 0}
      />
    </div>
  );
}
