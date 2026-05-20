import { requireRole } from "@/lib/auth";
import ManagerDashboardClient from "@/components/manager/ManagerDashboardClient";
import { getManagerDashboardData } from "@/lib/queries/dashboard";

export const dynamic = "force-dynamic";

export default async function ManagerDashboardPage({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;
  const userRole = await requireRole(["manager", "admin", "super_admin"]);

  // Fetch all dashboard data using the centralized manager dashboard query layer
  const { products, rawSessions, rawSaleItems } = await getManagerDashboardData(userRole.storeId);

  return (
    <div className="lg:p-8 max-w-full mx-auto pb-24 lg:pb-0">
      <ManagerDashboardClient 
        storeId={userRole.storeId as string}
        initialProducts={products || []}
        rawSessions={rawSessions || []}
        rawSaleItems={rawSaleItems as any}
        title="Manager Dashboard"
        subtitle="Overview of today's performance, inventory health, and top selling products."
      />
    </div>
  );
}
