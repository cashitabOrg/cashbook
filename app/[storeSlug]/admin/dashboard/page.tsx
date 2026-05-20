import { requireRole } from "@/lib/auth";
import AdminDashboardClient from "@/components/admin/AdminDashboardClient";
import { getAdminDashboardData } from "@/lib/queries/dashboard";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;
  const userRole = await requireRole(["admin", "super_admin"]);

  // Fetch all dashboard data using the centralized backend query layer
  const {
    products,
    rawSessions,
    rawSaleItems,
    recentAdjustments,
    store,
    staffCount,
  } = await getAdminDashboardData(userRole.storeId);

  return (
    <div className="lg:p-8 max-w-full mx-auto pb-24">
      <AdminDashboardClient 
        storeId={userRole.storeId as string}
        initialProducts={products || []}
        rawSessions={rawSessions || []}
        rawSaleItems={rawSaleItems as any}
        recentAdjustments={recentAdjustments || []}
        title="Store Performance Hub"
        subtitle="A real-time overview of your lifetime revenue, inventory health, and core business metrics."
        plan={store?.plan || 'free'}
        isExempt={store?.is_billing_exempt || false}
        staffCount={staffCount || 0}
      />
    </div>
  );
}
