import StaffTable from "@/components/admin/StaffTable";
import { requireRole } from "@/lib/auth";
import { getStaffPageData } from "@/lib/queries/staff";

export const dynamic = "force-dynamic";

export default async function AdminStaffPage({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;
  const userRole = await requireRole(["admin", "super_admin"]);

  // Fetch all staff and store meta using the centralized backend query layer
  const { staffList, store, totalUserCount, error } = await getStaffPageData(userRole.storeId);

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 text-red-700 p-4 rounded-md">
          Failed to load staff list: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="lg:p-8 max-w-full mx-auto">
      <StaffTable 
        storeSlug={storeSlug} 
        staffList={staffList || []} 
        plan={store?.plan || 'free'}
        isExempt={store?.is_billing_exempt || false}
        totalUserCount={totalUserCount || 0}
      />
    </div>
  );
}
