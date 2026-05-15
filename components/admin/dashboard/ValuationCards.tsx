import { TrendingUp, Package, DollarSign } from "lucide-react";

type ValuationCardsProps = {
  totalStockCost: number;
  totalRetailValue: number;
  potentialProfit: number;
};

export default function ValuationCards({
  totalStockCost,
  totalRetailValue,
  potentialProfit
}: ValuationCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 lg:gap-5">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-3 lg:p-6 flex items-center gap-4">
        <div className="bg-amber-50 p-2 lg:p-3 rounded-xl text-amber-600">
           <TrendingUp className="w-4 h-4 lg:w-6 lg:h-6" />
        </div>
        <div>
          <p className="text-[8px] lg:text-xs font-black text-slate-400 uppercase tracking-widest">Stock Cost</p>
          <p className="text-xs lg:text-xl font-black text-slate-200">₦{totalStockCost.toLocaleString(undefined, { minimumFractionDigits: 0 })}</p>
        </div>
      </div>
      
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-3 lg:p-6 flex items-center gap-4">
        <div className="bg-blue-50 p-2 lg:p-3 rounded-xl text-blue-600">
           <Package className="w-4 h-4 lg:w-6 lg:h-6" />
        </div>
        <div>
          <p className="text-[8px] lg:text-xs font-black text-slate-400 uppercase tracking-widest">Retail Value</p>
          <p className="text-xs lg:text-xl font-black text-slate-200">₦{totalRetailValue.toLocaleString(undefined, { minimumFractionDigits: 0 })}</p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-3 lg:p-6 flex items-center gap-4 col-span-2 lg:col-span-1">
        <div className="bg-emerald-50 p-2 lg:p-3 rounded-xl text-emerald-600">
           <DollarSign className="w-4 h-4 lg:w-6 lg:h-6" />
        </div>
        <div>
          <p className="text-[8px] lg:text-xs font-black text-slate-400 uppercase tracking-widest">Est. Profit Margin</p>
          <p className="text-xs lg:text-xl font-black text-emerald-600">₦{potentialProfit.toLocaleString(undefined, { minimumFractionDigits: 0 })}</p>
        </div>
      </div>
    </div>
  );
}
