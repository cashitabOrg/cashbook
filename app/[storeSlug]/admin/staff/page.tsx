import { createClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";
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
  const supabase = supabaseAdmin;

  // 1. Fetch store plan
  const { data: store } = await supabase
    .from("stores")
    .select("plan, is_billing_exempt")
    .eq("id", userRole.storeId)
    .single();

  // 2. Fetch total count of users (Admin + Managers) for the limit check
  const { count: totalUserCount } = await supabase
    .from("users")
    .select("*", { count: 'exact', head: true })
    .eq("store_id", userRole.storeId);

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
      <StaffTable 
        storeSlug={storeSlug} 
        staffList={staff || []} 
        plan={store?.plan || 'free'}
        isExempt={store?.is_billing_exempt || false}
        totalUserCount={totalUserCount || 0}
      />
    </div>
  );
}
