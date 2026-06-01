import { requireRole } from "@/lib/auth";
import { getStaffPageData } from "@/lib/queries/staff";
import { getBillingPageData } from "@/lib/queries/store";
import { PlanType } from "@/lib/plans";
import SettingsClient from "@/components/admin/SettingsClient";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;
  const userRole = await requireRole(["admin", "super_admin"]);

  // Fetch staff page data and billing subscription page data in parallel
  const [staffData, billingData] = await Promise.all([
    getStaffPageData(userRole.storeId),
    getBillingPageData(storeSlug),
  ]);

  if (staffData.error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 p-4 rounded-md border border-red-200 dark:border-red-500/20">
          Failed to load settings data: {staffData.error}
        </div>
      </div>
    );
  }

  return (
    <div className="lg:p-8 max-w-full mx-auto pb-24">
      <SettingsClient
        storeSlug={storeSlug}
        staffList={staffData.staffList || []}
        plan={staffData.store?.plan || 'free'}
        isExempt={staffData.store?.is_billing_exempt || false}
        totalUserCount={staffData.totalUserCount || 0}
        currentPlan={billingData.store?.plan as PlanType || 'free'}
        subscription={billingData.subscription}
        usage={billingData.usage}
      />
    </div>
  );
}
