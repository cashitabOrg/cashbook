import { createClient } from "@/lib/supabase-server";
import { requireRole } from "@/lib/auth";
import CorrectionSalesUI from "@/components/manager/CorrectionSalesUI";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function CorrectionSalesPage({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;
  const userRole = await requireRole(["manager", "admin", "super_admin"]);

  // Safety check: Make sure this is ONLY accessible if they navigate to it
  if (process.env.NODE_ENV !== "development") {
    // Only allow in development to prevent managers from hitting it
    redirect(`/${storeSlug}/manager/dashboard`);
  }

  const supabase = await createClient();

  const { data: products, error } = await supabase
    .from("products")
    .select("id, store_id, name, unit, quantity")
    .eq("store_id", userRole.storeId)
    .order("name");

  return (
    <div className="h-full flex flex-col">
      <CorrectionSalesUI 
        storeSlug={storeSlug} 
        storeId={userRole.storeId as string}
        managerId={userRole.id}
        initialProducts={products || []} 
      />
    </div>
  );
}
