import { createAdminClient } from "@/lib/supabase-admin";
import { requireRole } from "@/lib/auth";
import BroadcastsClient from "@/components/super-admin/BroadcastsClient";

export const dynamic = "force-dynamic";

export default async function SuperAdminBroadcastsPage() {
  await requireRole(["super_admin"]);
  const adminClient = createAdminClient();

  const { data: broadcasts, error } = await adminClient
    .from("system_broadcasts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    // If table doesn't exist yet, pass empty array to prevent crashing while waiting for user to run SQL
    if (error.code === '42P01') {
      return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
           <BroadcastsClient broadcasts={[]} />
        </div>
      );
    }
    return <div className="p-8 text-red-600 font-bold">Failed to load broadcasts: {error.message}</div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">System Broadcasts</h1>
        <p className="mt-2 text-sm text-slate-600">
          Push global alerts and announcements to all connected tenants instantly.
        </p>
      </div>

      <BroadcastsClient broadcasts={broadcasts || []} />
    </div>
  );
}
