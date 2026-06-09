import { requireRole } from "@/lib/auth";
import ManagerHistoryClient from "@/components/manager/ManagerHistoryClient";
import { History } from "lucide-react";
import { getManagerHistory } from "@/lib/queries/sales";

export const dynamic = "force-dynamic";

export default async function ManagerHistoryPage({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;
  const userRole = await requireRole(["manager", "admin", "super_admin"]);

  // Fetch sorted daily session groups and edit options via the centralized query layer
  const { dailyGroups, availableProducts, error: historyError } = await getManagerHistory(
    userRole.storeId,
    userRole.id
  );

  if (historyError) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="bg-rose-50 border border-rose-100 text-rose-700 p-6 rounded-2xl shadow-sm text-center">
          <p className="font-bold text-sm mb-1">Could not load history</p>
          <p className="text-xs opacity-60">{historyError}</p>
          <p className="text-xs mt-3 text-slate-500 dark:text-gray-400">Try refreshing the page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-full mx-auto pb-24">
      {/* Title header — desktop only, hidden on mobile (filter bar replaces it) */}
      <div className="hidden lg:flex bg-white dark:bg-[#1C1C1E] lg:rounded-xl lg:shadow-sm lg:border border-slate-200 dark:border-[#2C2C2E] px-4 lg:px-6 py-4 items-center justify-between mb-2 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-500/20">
            <History className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm lg:text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none">History</h1>
            <p className="text-[8px] lg:text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mt-1">Past Sales Sessions</p>
          </div>
        </div>
      </div>

      <div className="px-2 lg:px-0">
        <ManagerHistoryClient 
          dailyGroups={dailyGroups || []} 
          availableProducts={availableProducts || []}
        />
      </div>
    </div>
  );
}
