import { DollarSign, Package, AlertCircle } from "lucide-react";
import { formatCurrency } from "@/lib/format";

type ManagerSummaryCardsProps = {
  totalRevenue: number;
  productsCount: number;
  lowStockCount: number;
};

export default function ManagerSummaryCards({
  totalRevenue,
  productsCount,
  lowStockCount
}: ManagerSummaryCardsProps) {
  return (
    <div className="grid grid-cols-3 gap-2 lg:gap-5">
      <div className="bg-white dark:bg-[#1C1C1E] overflow-hidden lg:rounded-2xl lg:shadow-sm lg:border border-slate-200 dark:border-[#2C2C2E] shadow-sm">
        <div className="p-3 lg:p-6">
          <div className="flex flex-col lg:flex-row items-center lg:items-start lg:gap-5">
            <div className="flex-shrink-0 bg-blue-50 dark:bg-blue-500/10 rounded-xl p-2 lg:p-4">
              <DollarSign className="h-4 w-4 lg:h-6 lg:w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-center lg:text-left mt-2 lg:mt-0">
              <p className="text-[8px] lg:text-sm font-bold text-slate-500 dark:text-gray-400 uppercase tracking-tighter">Revenue</p>
              <div className="text-xs lg:text-3xl font-extrabold text-slate-900 dark:text-white leading-none mt-1 truncate">{formatCurrency(totalRevenue)}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-[#1C1C1E] overflow-hidden lg:rounded-2xl lg:shadow-sm lg:border border-slate-200 dark:border-[#2C2C2E] shadow-sm">
        <div className="p-3 lg:p-6">
          <div className="flex flex-col lg:flex-row items-center lg:items-start lg:gap-5">
            <div className="flex-shrink-0 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl p-2 lg:p-4">
              <Package className="h-4 w-4 lg:h-6 lg:w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="text-center lg:text-left mt-2 lg:mt-0">
              <p className="text-[8px] lg:text-sm font-bold text-slate-500 dark:text-gray-400 uppercase tracking-tighter whitespace-nowrap">Inventory</p>
              <div className="text-xs lg:text-3xl font-extrabold text-slate-900 dark:text-white leading-none mt-1">{productsCount}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-[#1C1C1E] overflow-hidden lg:rounded-2xl lg:shadow-sm lg:border border-slate-200 dark:border-[#2C2C2E] shadow-sm">
        <div className="p-3 lg:p-6">
          <div className="flex flex-col lg:flex-row items-center lg:items-start lg:gap-5">
            <div className="flex-shrink-0 bg-red-50 dark:bg-red-500/10 rounded-xl p-2 lg:p-4">
              <AlertCircle className="h-4 w-4 lg:h-6 lg:w-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="text-center lg:text-left mt-2 lg:mt-0">
              <p className="text-[8px] lg:text-sm font-bold text-slate-500 dark:text-gray-400 uppercase tracking-tighter whitespace-nowrap">Re-stock</p>
              <div className="text-xs lg:text-3xl font-extrabold text-slate-900 dark:text-white leading-none mt-1">{lowStockCount}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
