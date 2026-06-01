"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Users, CreditCard } from "lucide-react";
import StaffTable from "./StaffTable";
import BillingDashboard from "./BillingDashboard";
import { PlanType } from "@/lib/plans";

interface SettingsClientProps {
  storeSlug: string;
  staffList: any[];
  plan: string;
  isExempt?: boolean;
  totalUserCount: number;
  currentPlan: PlanType;
  subscription: any;
  usage: {
    products: number;
    staff: number;
  };
}

export default function SettingsClient({
  storeSlug,
  staffList,
  plan,
  isExempt = false,
  totalUserCount,
  currentPlan,
  subscription,
  usage
}: SettingsClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<"staff" | "billing">("staff");

  useEffect(() => {
    if (tabParam === "billing") {
      setActiveTab("billing");
    } else {
      setActiveTab("staff");
    }
  }, [tabParam]);

  const handleTabChange = (newTab: "staff" | "billing") => {
    setActiveTab(newTab);
    const params = new URLSearchParams(window.location.search);
    params.set("tab", newTab);
    router.replace(`${window.location.pathname}?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      {/* Horizontal Premium Settings Tab Switcher */}
      <div className="border-b border-gray-200 dark:border-[#2C2C2E] px-4 lg:px-0">
        <div className="flex gap-6 -mb-px">
          <button
            onClick={() => handleTabChange("staff")}
            className={`py-4 text-xs font-black uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "staff"
                ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            <Users className="w-4 h-4" />
            Team Members
          </button>
          <button
            onClick={() => handleTabChange("billing")}
            className={`py-4 text-xs font-black uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "billing"
                ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            <CreditCard className="w-4 h-4" />
            Billing & Subscriptions
          </button>
        </div>
      </div>

      {/* Tab Contents */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        {activeTab === "staff" ? (
          <StaffTable
            storeSlug={storeSlug}
            staffList={staffList}
            plan={plan}
            isExempt={isExempt}
            totalUserCount={totalUserCount}
          />
        ) : (
          <BillingDashboard
            storeSlug={storeSlug}
            currentPlan={currentPlan}
            subscription={subscription}
            usage={usage}
          />
        )}
      </div>
    </div>
  );
}
