import { createClient } from "@/lib/supabase-server";
import StaffTable from "@/components/admin/StaffTable";
import { requireRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminStaffPage({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;
  const userRole = await requireRole(["admin", "super_admin"]);
  const supabase = await createClient();

  // Fetch managers for this store
  const { data: staff, error } = await supabase
    .from("users")
    .select("id, full_name, username, is_active, created_at")
    .eq("store_id", userRole.storeId)
    .eq("role", "manager") // Only fetch managers (don't list admins here unless requested)
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 text-red-700 p-4 rounded-md">
          Failed to load staff list: {error.message}
        </div>
      </div>
    );
  }

  return (
    <div className="lg:p-8 max-w-full mx-auto">
      <StaffTable storeSlug={storeSlug} staffList={staff || []} />
    </div>
  );
}
