import { createAdminClient } from "@/lib/supabase-admin";
import { requireRole } from "@/lib/auth";
import SuperAdminStoresClient from "@/components/super-admin/SuperAdminStoresClient";
import { Building2, Users, CreditCard, Activity } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SuperAdminDashboard() {
  await requireRole(["super_admin"]);
  const adminClient = createAdminClient();

  // 1. Fetch all stores securely
  const { data: rawStores, error: storesError } = await adminClient
    .from("stores")
    .select(`
      id,
      name,
      slug,
      plan,
      is_active,
      is_billing_exempt,
      created_at
    `)
    .order("created_at", { ascending: false });

  if (storesError) {
    console.error("Dashboard Fetch Error:", storesError);
    return <div className="p-8 text-red-600 font-bold">Failed to load platform stores: {storesError.message}</div>;
  }

  // 2. Resolve owners by looking for users with 'admin' role in each store
  const storeIds = (rawStores || []).map(s => s.id);
  let ownersMap: Record<string, { full_name: string, username: string }> = {};

  if (storeIds.length > 0) {
    const { data: storeAdmins } = await adminClient
      .from("users")
      .select("store_id, full_name, username")
      .in("store_id", storeIds)
      .eq("role", "admin");
    
    if (storeAdmins) {
      storeAdmins.forEach(admin => {
        if (!ownersMap[admin.store_id]) {
          ownersMap[admin.store_id] = { full_name: admin.full_name, username: admin.username };
        }
      });
    }
  }

  // 3. Fetch all users count
  const { count: usersCount } = await adminClient
    .from("users")
    .select("*", { count: "exact", head: true });

  // 4. Fetch global revenue
  const { data: globalRevenueData } = await adminClient
    .from("sales_sessions")
    .select("total_revenue")
    .eq("status", "closed");

  const totalPlatformRevenue = (globalRevenueData || []).reduce(
    (acc, curr) => acc + Number(curr.total_revenue),
    0
  );

  const stores = (rawStores || []).map(s => ({
    id: s.id,
    name: s.name,
    slug: s.slug,
    plan: s.plan,
    is_active: s.is_active,
    is_billing_exempt: s.is_billing_exempt,
    created_at: s.created_at,
    ownerName: ownersMap[s.id]?.full_name || "No Admin Assigned",
    ownerUsername: ownersMap[s.id]?.username || "none"
  }));

  const activeStores = stores.filter(s => s.is_active).length;
  const newStoresThisMonth = stores.filter(s => {
    const d = new Date(s.created_at);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Platform Overview</h1>
        <p className="mt-2 text-sm text-slate-600">
          Global metrics and tenant orchestration across the entire FrozenPOS infrastructure.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1: Stores */}
        <div className="bg-white overflow-hidden rounded-xl shadow-sm border border-slate-200 p-5 flex items-center">
          <div className="bg-blue-50 rounded-lg p-3">
            <Building2 className="w-6 h-6 text-blue-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-slate-500">Total Tenants</p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold text-slate-900">{stores.length}</p>
              <span className="text-sm text-emerald-600 font-medium">+{newStoresThisMonth} this mo</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Users */}
        <div className="bg-white overflow-hidden rounded-xl shadow-sm border border-slate-200 p-5 flex items-center">
          <div className="bg-purple-50 rounded-lg p-3">
            <Users className="w-6 h-6 text-purple-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-slate-500">Total Users</p>
            <p className="text-2xl font-bold text-slate-900">{usersCount || 0}</p>
          </div>
        </div>

        {/* KPI 3: Revenue */}
        <div className="bg-white overflow-hidden rounded-xl shadow-sm border border-slate-200 p-5 flex items-center">
          <div className="bg-emerald-50 rounded-lg p-3">
            <Activity className="w-6 h-6 text-emerald-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-slate-500">GMV (Globally Processed)</p>
            <p className="text-2xl font-bold text-slate-900">${totalPlatformRevenue.toFixed(2)}</p>
          </div>
        </div>

        {/* KPI 4: Active Ratio */}
        <div className="bg-white overflow-hidden rounded-xl shadow-sm border border-slate-200 p-5 flex items-center">
          <div className="bg-amber-50 rounded-lg p-3">
            <CreditCard className="w-6 h-6 text-amber-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-slate-500">Active Deployments</p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold text-slate-900">{activeStores}</p>
              <span className="text-sm text-slate-400">/ {stores.length} total</span>
            </div>
          </div>
        </div>
      </div>

      <SuperAdminStoresClient stores={stores} />
    </div>
  );
}
