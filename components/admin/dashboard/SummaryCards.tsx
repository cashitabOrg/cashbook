import { DollarSign, Package, AlertCircle } from "lucide-react";

type SummaryCardsProps = {
  totalRevenue: number;
  startDate: string;
  endDate: string;
  productsCount: number;
  lowStockCount: number;
};

export default function SummaryCards({
  totalRevenue,
  startDate,
  endDate,
  productsCount,
  lowStockCount
}: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-5">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden col-span-2">
        <div className="p-3 lg:p-6">
          <div className="flex items-center lg:gap-5">
            <div className="flex-shrink-0 bg-blue-500/20 rounded-xl p-2 lg:p-4">
              <DollarSign className="h-4 w-4 lg:h-6 lg:w-6 text-blue-400" />
            </div>
            <div className="ml-3 lg:ml-0">
              <p className="text-[8px] lg:text-sm font-semibold text-slate-400 uppercase tracking-wider">Revenue ({startDate === endDate ? 'Today' : 'Range'})</p>
              <div className="text-xs lg:text-3xl font-black text-white leading-none mt-1">₦{totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 0 })}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-3 lg:p-6">
          <div className="flex items-center lg:gap-5">
            <div className="flex-shrink-0 bg-emerald-500/20 rounded-xl p-2 lg:p-4">
              <Package className="h-4 w-4 lg:h-6 lg:w-6 text-emerald-400" />
            </div>
            <div className="ml-3 lg:ml-0">
              <p className="text-[8px] lg:text-sm font-semibold text-slate-400 uppercase tracking-wider">Products</p>
              <div className="text-xs lg:text-3xl font-black text-white leading-none mt-1">{productsCount}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-3 lg:p-6">
          <div className="flex items-center lg:gap-5">
            <div className="flex-shrink-0 bg-red-500/20 rounded-xl p-2 lg:p-4">
              <AlertCircle className="h-4 w-4 lg:h-6 lg:w-6 text-red-400" />
            </div>
            <div className="ml-3 lg:ml-0">
              <p className="text-[8px] lg:text-sm font-semibold text-slate-400 uppercase tracking-wider">Low Stock</p>
              <div className="text-xs lg:text-3xl font-black text-white leading-none mt-1">{lowStockCount}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
