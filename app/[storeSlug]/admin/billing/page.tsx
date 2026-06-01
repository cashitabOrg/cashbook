import { redirect } from "next/navigation";

export default async function BillingPageRedirect({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;
  redirect(`/${storeSlug}/admin/settings?tab=billing`);
}
