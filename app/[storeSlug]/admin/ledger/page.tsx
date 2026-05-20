import { requireRole } from "@/lib/auth";
import LedgerClient from "@/components/admin/LedgerClient";
import { getLedgerData } from "@/lib/queries/store";
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
  await requireRole(["admin", "super_admin"]);

  // Fetch all ledger data using the centralized backend query layer
  const { products, transactions, error } = await getLedgerData(storeSlug);

  if (error) {
    console.error("LEDGER FETCH ERROR:", error);
    return <div className="p-8 text-red-600">Error loading ledger data: {error}</div>;
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
