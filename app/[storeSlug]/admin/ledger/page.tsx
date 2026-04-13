import { requireRole } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import LedgerClient from "@/components/admin/LedgerClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Stock Movement & Audit",
};

export default async function LedgerPage({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;
  const userRole = await requireRole(["admin", "super_admin"]);

  // Fetch Core Store Data
  const { data: store } = await supabaseAdmin
    .from("stores")
    .select("id, name")
    .eq("slug", storeSlug)
    .single();

  if (!store) return null;

  // 1. Fetch available products for the dropdown filter
  const { data: products } = await supabaseAdmin
    .from("products")
    .select("id, name")
    .eq("store_id", store.id)
    .order("name", { ascending: true });

  // 2. Fetch the most recent 1000 ledger transactions for the UI to digest and group
  const { data: transactions, error: fetchErr } = await supabaseAdmin
    .from("inventory_movements")
    .select(`
      *,
      products (name, unit),
      users:actor_id (full_name)
    `)
    .eq("store_id", store.id)
    .order("created_at", { ascending: false })
    .limit(1500);

  if (fetchErr) {
    console.error("LEDGER FETCH ERROR:", fetchErr);
  }

  return (
    <div className="p-2 md:p-4 max-w-full">
      <LedgerClient 
        transactions={transactions || []} 
        products={products || []} 
      />
    </div>
  );
}
