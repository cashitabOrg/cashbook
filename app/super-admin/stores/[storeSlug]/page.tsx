import { createAdminClient } from "@/lib/supabase-admin";
import { requireRole } from "@/lib/auth";
import Link from "next/link";
import { ArrowLeft, Store, Calendar, CreditCard, Activity, Users, Package } from "lucide-react";
import ImpersonateButtonClient from "@/components/super-admin/ImpersonateButtonClient";
import DangerZoneClient from "@/components/super-admin/DangerZoneClient";
import BillingExemptToggle from "@/components/super-admin/BillingExemptToggle";

export const dynamic = "force-dynamic";

export default async function SuperAdminStoreInspection({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;
  await requireRole(["super_admin"]);
  const adminClient = createAdminClient();

  // 1. Resolve store profile securely
  const { data: store, error: storeError } = await adminClient
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
    .eq("slug", storeSlug)
    .single();

  if (storeError || !store) {
    return <div className="p-8 text-red-600 font-bold">Failed to load payload for: {storeSlug}</div>;
  }

  // 2. Fetch the store owner (User with 'admin' role for this store)
  const { data: owner } = await adminClient
    .from("users")
    .select("full_name, username, email")
    .eq("store_id", store.id)
    .eq("role", "admin")
    .maybeSingle();

  const storeWithOwner = {
    ...store,
    users: owner || null
  };

  // 2. Fetch specific store metrics
  const { count: userCount } = await adminClient
    .from("users")
    .select("*", { count: "exact", head: true })
    .eq("store_id", store.id);

  const { count: productCount } = await adminClient
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("store_id", store.id);

  const { data: sessions } = await adminClient
    .from("sales_sessions")
    .select("total_revenue")
    .eq("store_id", store.id)
    .eq("status", "closed");

  const lifetimeRevenue = (sessions || []).reduce((acc, curr) => acc + Number(curr.total_revenue), 0);
  const sessionCount = sessions?.length || 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      
      {/* Back & Breadcrumb */}
      <div>
        <Link href="/super-admin/dashboard" className="text-sm font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 w-fit mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Deployments
        </Link>
        <div className="flex items-center justify-between">
          <div>
             <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-3">
               <Store className="w-8 h-8 text-slate-400" />
               <span className="capitalize">{store.name}</span>
             </h1>
          </div>
          <div className="flex items-center gap-3">
            <ImpersonateButtonClient storeId={store.id} storeSlug={store.slug} />
            {!store.is_active && (
               <span className="inline-flex items-center gap-1.5 rounded-md bg-red-100 px-3 py-1 text-sm font-bold text-red-800 border border-red-200 uppercase tracking-widest">
                 Suspended
               </span>
            )}
          </div>
        </div>
      </div>

      {/* Profile Details */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
           <Store className="w-5 h-5 text-slate-600" />
           <h3 className="text-base font-semibold leading-6 text-slate-900">Tenant Identity Profile</h3>
        </div>
        <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-2 gap-8 divide-y md:divide-y-0 md:divide-x divide-slate-100">
           <div className="space-y-4">
              <div>
                 <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1">Owner Contact</p>
                 <p className="text-lg font-medium text-slate-900">{storeWithOwner.users?.full_name || "N/A"}</p>
                 <p className="text-sm text-slate-500 font-mono">@{storeWithOwner.users?.username || "none"}</p>
                 {storeWithOwner.users?.email && <p className="text-sm text-blue-600">{storeWithOwner.users.email}</p>}
              </div>
              <div>
                 <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1">Provision Date</p>
                 <p className="text-base text-slate-900 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    {new Date(store.created_at).toLocaleDateString()}
                 </p>
              </div>
           </div>
           
           <div className="space-y-4 pt-4 md:pt-0 md:pl-8">
              <div>
                 <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1">Routing Slug</p>
                 <p className="font-mono text-slate-900 bg-slate-50 px-2 py-1 rounded inline-flex border border-slate-100">
                   {store.slug}
                 </p>
              </div>
              <div>
                 <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1">Current Plan</p>
                 <p className="text-base text-slate-900 flex items-center gap-2 capitalize font-semibold tracking-wide">
                    <CreditCard className="w-4 h-4 text-slate-400" />
                    {store.plan} Tier
                 </p>
              </div>
              
              <div className="pt-2 border-t border-slate-100">
                <BillingExemptToggle storeId={store.id} initialValue={store.is_billing_exempt || false} />
              </div>
           </div>
        </div>
      </div>

      {/* Database Metrics */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
           <Activity className="w-5 h-5 text-slate-600" />
           <h3 className="text-base font-semibold leading-6 text-slate-900">Deep Analytics (Bypassing RLS)</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 divide-slate-100">
          
          <div className="p-6">
            <p className="text-sm font-medium text-slate-500 mb-2 flex items-center gap-2 pb-2 border-b border-slate-100">
               <DollarSign className="w-4 h-4" /> Lifetime Revenue
            </p>
            <p className="text-3xl font-extrabold text-emerald-600">${lifetimeRevenue.toFixed(2)}</p>
            <p className="text-xs text-slate-400 mt-1">Sum of {sessionCount} total sessions</p>
          </div>

          <div className="p-6 sm:border-l border-slate-100">
            <p className="text-sm font-medium text-slate-500 mb-2 flex items-center gap-2 pb-2 border-b border-slate-100">
               <Package className="w-4 h-4" /> Catalog Size
            </p>
            <p className="text-3xl font-extrabold text-slate-900">{productCount || 0}</p>
            <p className="text-xs text-slate-400 mt-1">Unique products added</p>
          </div>

          <div className="p-6 sm:border-t-0 border-t lg:border-l border-slate-100">
            <p className="text-sm font-medium text-slate-500 mb-2 flex items-center gap-2 pb-2 border-b border-slate-100">
               <Users className="w-4 h-4" /> Auth Nodes
            </p>
            <p className="text-3xl font-extrabold text-slate-900">{userCount || 0}</p>
            <p className="text-xs text-slate-400 mt-1">Admins + Managers provisioned</p>
          </div>

        </div>
      </div>

      <DangerZoneClient storeId={store.id} />
    </div>
  );
}

// Ensure the DollarSign is imported above
import { DollarSign } from "lucide-react";
