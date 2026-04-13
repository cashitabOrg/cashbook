"use client";

import { stopImpersonation } from "@/app/actions/impersonation";
import { XCircle, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ImpersonationBanner() {
  const [isStopping, setIsStopping] = useState(false);
  const router = useRouter();

  const handleStop = async () => {
    setIsStopping(true);
    const res = await stopImpersonation();
    setIsStopping(false);

    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Impersonation ended.");
      router.push("/super-admin/dashboard");
      router.refresh();
    }
  };

  return (
    <div className="bg-red-600 text-white px-4 py-2 flex items-center justify-center gap-4 text-sm font-semibold sticky top-0 z-50">
      <span className="flex items-center gap-2">
        <UserCheck className="w-5 h-5" />
        SUPER ADMIN IMPERSONATION MODE ACTIVE
      </span>
      <button 
        onClick={handleStop} 
        disabled={isStopping}
        className="bg-white/20 hover:bg-white/30 text-white rounded px-3 py-1 text-xs flex items-center gap-1 transition-colors"
      >
        <XCircle className="w-4 h-4" />
        {isStopping ? "Stopping..." : "Stop Impersonating"}
      </button>
    </div>
  );
}
