import { redirect } from "next/navigation";

export default async function ReportsPageRedirect({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;
  redirect(`/${storeSlug}/admin/products?tab=reports`);
}
