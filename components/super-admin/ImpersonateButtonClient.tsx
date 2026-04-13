"use client";

import { useState } from "react";
import { startImpersonation } from "@/app/actions/impersonation";
import { UserCheck } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function ImpersonateButtonClient({ storeId, storeSlug }: { storeId: string; storeSlug: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleImpersonate = async () => {
    setIsLoading(true);
    const res = await startImpersonation(storeId);
    setIsLoading(false);

    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Impersonation active. Redirecting...");
      router.push(`/${storeSlug}/admin/dashboard`);
    }
  };

  return (
    <button
      onClick={handleImpersonate}
      disabled={isLoading}
      className="inline-flex items-center gap-2 rounded-md bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-purple-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600 disabled:opacity-50"
    >
      <UserCheck className="w-4 h-4" />
      {isLoading ? "Loading..." : "Impersonate Tenant"}
    </button>
  );
}
