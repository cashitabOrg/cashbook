import { createAdminClient } from "@/lib/supabase-admin";
import { requireRole } from "@/lib/auth";
import SuperAdminPlansClient from "@/components/super-admin/SuperAdminPlansClient";

export const dynamic = "force-dynamic";

export default async function SuperAdminPlansPage() {
  await requireRole(["super_admin"]);
  const adminClient = createAdminClient();

  // Fetch all stores
  const { data: storesData, error } = await adminClient
    .from("stores")
    .select(`
      id,
      name,
      slug,
      plan
    `)
    .order("name", { ascending: true });

  if (error) {
    return <div className="p-8 text-red-600 font-bold">Failed to load platform stores: {error.message}</div>;
  }

  const stores = (storesData || []).map(s => ({
    id: s.id,
    name: s.name,
    slug: s.slug,
    plan: s.plan,
  }));

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Tenant Billing Allocations</h1>
        <p className="mt-2 text-sm text-slate-600">
          Provision capacity constraints and upgrade entitlements manually across the SaaS infrastructure.
        </p>
      </div>

      <SuperAdminPlansClient stores={stores} />
    </div>
  );
}
