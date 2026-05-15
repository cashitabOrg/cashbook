import { DollarSign, Package, AlertCircle } from "lucide-react";

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
      <div className="bg-white overflow-hidden lg:rounded-2xl lg:shadow-sm lg:border border-slate-200 shadow-sm">
        <div className="p-3 lg:p-6">
          <div className="flex flex-col lg:flex-row items-center lg:items-start lg:gap-5">
            <div className="flex-shrink-0 bg-blue-50 rounded-xl p-2 lg:p-4">
              <DollarSign className="h-4 w-4 lg:h-6 lg:w-6 text-blue-600" />
            </div>
            <div className="text-center lg:text-left mt-2 lg:mt-0">
              <p className="text-[8px] lg:text-sm font-bold text-slate-500 uppercase tracking-tighter">Revenue</p>
              <div className="text-xs lg:text-3xl font-extrabold text-slate-900 leading-none mt-1 truncate">₦{totalRevenue.toFixed(0)}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white overflow-hidden lg:rounded-2xl lg:shadow-sm lg:border border-slate-200 shadow-sm">
        <div className="p-3 lg:p-6">
          <div className="flex flex-col lg:flex-row items-center lg:items-start lg:gap-5">
            <div className="flex-shrink-0 bg-emerald-50 rounded-xl p-2 lg:p-4">
              <Package className="h-4 w-4 lg:h-6 lg:w-6 text-emerald-600" />
            </div>
            <div className="text-center lg:text-left mt-2 lg:mt-0">
              <p className="text-[8px] lg:text-sm font-bold text-slate-500 uppercase tracking-tighter whitespace-nowrap">Inventory</p>
              <div className="text-xs lg:text-3xl font-extrabold text-slate-900 leading-none mt-1">{productsCount}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white overflow-hidden lg:rounded-2xl lg:shadow-sm lg:border border-slate-200 shadow-sm">
        <div className="p-3 lg:p-6">
          <div className="flex flex-col lg:flex-row items-center lg:items-start lg:gap-5">
            <div className="flex-shrink-0 bg-red-50 rounded-xl p-2 lg:p-4">
              <AlertCircle className="h-4 w-4 lg:h-6 lg:w-6 text-red-600" />
            </div>
            <div className="text-center lg:text-left mt-2 lg:mt-0">
              <p className="text-[8px] lg:text-sm font-bold text-slate-500 uppercase tracking-tighter whitespace-nowrap">Re-stock</p>
              <div className="text-xs lg:text-3xl font-extrabold text-slate-900 leading-none mt-1">{lowStockCount}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
