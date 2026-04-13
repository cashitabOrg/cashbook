import { createAdminClient } from "@/lib/supabase-admin";
import { requireRole } from "@/lib/auth";
import SuperAdminUsersClient from "@/components/super-admin/SuperAdminUsersClient";

export const dynamic = "force-dynamic";

export default async function SuperAdminUsersPage() {
  await requireRole(["super_admin"]);
  const adminClient = createAdminClient();

  // Fetch all users across all platforms
  const { data: usersData, error } = await adminClient
    .from("users")
    .select(`
      id,
      full_name,
      username,
      email,
      role,
      is_active,
      created_at,
      stores (name)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    return <div className="p-8 text-red-600 font-bold">Failed to load platform users: {error.message}</div>;
  }

  const users = (usersData || []).map(u => ({
    id: u.id,
    full_name: u.full_name,
    username: u.username,
    email: u.email,
    role: u.role,
    is_active: u.is_active,
    created_at: u.created_at,
    // @ts-ignore
    storeName: u.stores?.name || "",
  }));

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">User Identity Management</h1>
        <p className="mt-2 text-sm text-slate-600">
          Global access control and suspension tools for all provisioned accounts across all tenants.
        </p>
      </div>

      <SuperAdminUsersClient users={users} />
    </div>
  );
}
