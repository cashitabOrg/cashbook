"use client";

import { useState, useTransition } from "react";
import { ShieldCheck, ShieldAlert, Loader2 } from "lucide-react";
import { toggleBillingExemption } from "@/app/actions/super-admin";
import { toast } from "sonner";

interface BillingExemptToggleProps {
  storeId: string;
  initialValue: boolean;
}

export default function BillingExemptToggle({ storeId, initialValue }: BillingExemptToggleProps) {
  const [isExempt, setIsExempt] = useState(initialValue);
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    startTransition(async () => {
      const res = await toggleBillingExemption(storeId, !isExempt);
      if (res?.error) {
        toast.error(res.error);
      } else {
        setIsExempt(!isExempt);
        toast.success(isExempt ? "Billing limits restored for this store." : "This store is now EXEMPT from all billing and limits.");
      }
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1">Billing Exemption</p>
      <button
        onClick={handleToggle}
        disabled={isPending}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all border-2 ${
          isExempt 
            ? "bg-amber-50 border-amber-200 text-amber-700 shadow-amber-100 shadow-md"
            : "bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300"
        } ${isPending ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        {isPending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isExempt ? (
          <ShieldCheck className="w-4 h-4" />
        ) : (
          <ShieldAlert className="w-4 h-4" />
        )}
        {isExempt ? "Exempt / White-listed" : "Standard Billing"}
      </button>
      <p className="text-[10px] text-slate-400 font-medium">
        {isExempt 
          ? "This store has no product limits, no staff limits, and will never expire." 
          : "Standard plan limits and automated expiry locks apply to this store."}
      </p>
    </div>
  );
}
