import { requireRole } from "@/lib/auth";
import AdminDashboardClient from "@/components/admin/AdminDashboardClient";
import { getAdminDashboardData } from "@/lib/queries/dashboard";
import { getLedgerData } from "@/lib/queries/store";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;
  const userRole = await requireRole(["admin", "super_admin"]);

  // Fetch both dashboard and ledger movements in parallel for the consolidated workspace
  const [dashboardData, ledgerData] = await Promise.all([
    getAdminDashboardData(userRole.storeId),
    getLedgerData(storeSlug),
  ]);

  const {
    products,
    rawSessions,
    rawSaleItems,
    recentAdjustments,
    store,
    staffCount,
  } = dashboardData;

  // Sanitize: flatten all Supabase join objects into plain JSON before crossing the RSC boundary.
  // This prevents Turbopack's "Cannot read properties of undefined (reading 'stack')" crash.
  const safeTransactions = (ledgerData.transactions || []).map((tx) => ({
    id: tx.id ?? null,
    store_id: tx.store_id ?? null,
    product_id: tx.product_id ?? null,
    transaction_type: tx.transaction_type ?? "",
    quantity_before: Number(tx.quantity_before ?? 0),
    quantity_change: Number(tx.quantity_change ?? 0),
    quantity_after: Number(tx.quantity_after ?? 0),
    reference_id: tx.reference_id ?? null,
    note: tx.note ?? null,
    actor_id: tx.actor_id ?? null,
    created_at: tx.created_at ?? "",
    product_name: (tx.products as any)?.name ?? null,
    product_unit: (tx.products as any)?.unit ?? null,
    staff_name: (tx.users as any)?.full_name ?? null,
    // Keep nested for backwards compat with LedgerClient filter/display logic
    products: tx.products ? { name: (tx.products as any).name ?? "", unit: (tx.products as any).unit ?? "" } : null,
    users: tx.users ? { full_name: (tx.users as any).full_name ?? "" } : null,
  }));

  return (
    <div className="lg:p-8 max-w-full mx-auto pb-24">
      <AdminDashboardClient 
        storeId={userRole.storeId as string}
        initialProducts={JSON.parse(JSON.stringify(products || []))}
        rawSessions={JSON.parse(JSON.stringify(rawSessions || []))}
        rawSaleItems={JSON.parse(JSON.stringify(rawSaleItems || []))}
        recentAdjustments={JSON.parse(JSON.stringify(recentAdjustments || []))}
        transactions={safeTransactions}
        title="Operational Hub"
        subtitle="A real-time overview of your store's lifetime revenue, inventory health, and audit movement logs."
        plan={store?.plan || 'free'}
        isExempt={store?.is_billing_exempt || false}
        staffCount={staffCount || 0}
      />
    </div>
  );
}
