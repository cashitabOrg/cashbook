import { redirect } from "next/navigation";

export default async function LedgerPageRedirect({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;
  redirect(`/${storeSlug}/admin/dashboard?tab=ledger`);
}
