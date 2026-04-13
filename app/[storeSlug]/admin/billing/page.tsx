import { requireRole } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { redirect } from "next/navigation";
import { getSubscriptionData } from "@/app/actions/billing";
import BillingDashboard from "@/components/admin/BillingDashboard";
import { PlanType } from "@/lib/plans";

export const dynamic = "force-dynamic";

export default async function BillingPage({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;
  const userRole = await requireRole(["admin", "super_admin"]);
  const supabase = supabaseAdmin;

  // 1. Fetch Store Data
  const { data: store, error: storeError } = await supabase
    .from("stores")
    .select("id, name, plan")
    .eq("slug", storeSlug)
    .single();

  if (storeError || !store) {
    redirect("/login");
  }

  // 2. Fetch Subscription Data
  const subscription = await getSubscriptionData(store.id);

  // 3. Fetch Usage Stats
  const { count: productCount } = await supabase
    .from("products")
    .select("*", { count: 'exact', head: true })
    .eq("store_id", store.id);

  const { count: staffCount } = await supabase
    .from("users")
    .select("*", { count: 'exact', head: true })
    .eq("store_id", store.id);

  return (
    <div className="lg:p-8 max-w-full mx-auto">
      <BillingDashboard 
        storeSlug={storeSlug}
        currentPlan={store.plan as PlanType}
        subscription={subscription}
        usage={{
          products: productCount || 0,
          staff: staffCount || 0
        }}
      />
    </div>
  );
}
