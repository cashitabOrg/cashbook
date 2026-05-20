import { requireRole } from "@/lib/auth";
import { redirect } from "next/navigation";
import BillingDashboard from "@/components/admin/BillingDashboard";
import { PlanType } from "@/lib/plans";
import { getBillingPageData } from "@/lib/queries/store";

export const dynamic = "force-dynamic";

export default async function BillingPage({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;
  await requireRole(["admin", "super_admin"]);

  // Fetch all billing and subscription data via the centralized query layer
  const { store, subscription, usage, error } = await getBillingPageData(storeSlug);

  if (error || !store) {
    redirect("/login");
  }

  return (
    <div className="lg:p-8 max-w-full mx-auto">
      <BillingDashboard 
        storeSlug={storeSlug}
        currentPlan={store.plan as PlanType}
        subscription={subscription}
        usage={usage}
      />
    </div>
  );
}
