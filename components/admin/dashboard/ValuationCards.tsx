import { TrendingUp, Package, DollarSign } from "lucide-react";
import { Card } from "@/components/ui/Card";

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
    <div className="grid grid-cols-3 gap-2 md:gap-6">
      <Card className="flex flex-col sm:flex-row items-start sm:items-center gap-1.5 sm:gap-4 p-2 sm:p-4 md:p-6">
        <div className="bg-amber-100 dark:bg-amber-500/10 p-1.5 sm:p-4 rounded-xl text-amber-600 shrink-0">
           <TrendingUp className="w-4 h-4 sm:w-6 sm:h-6" />
        </div>
        <div>
          <p className="text-[9px] sm:text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest leading-tight">Stock Cost</p>
          <p className="text-sm sm:text-lg md:text-2xl font-semibold mt-0.5 md:mt-1">₦{totalStockCost.toLocaleString(undefined, { minimumFractionDigits: 0 })}</p>
        </div>
      </Card>
      
      <Card className="flex flex-col sm:flex-row items-start sm:items-center gap-1.5 sm:gap-4 p-2 sm:p-4 md:p-6">
        <div className="bg-blue-100 dark:bg-blue-500/10 p-1.5 sm:p-4 rounded-xl text-blue-600 shrink-0">
           <Package className="w-4 h-4 sm:w-6 sm:h-6" />
        </div>
        <div>
          <p className="text-[9px] sm:text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest leading-tight">Retail Value</p>
          <p className="text-sm sm:text-lg md:text-2xl font-semibold mt-0.5 md:mt-1">₦{totalRetailValue.toLocaleString(undefined, { minimumFractionDigits: 0 })}</p>
        </div>
      </Card>

      <Card className="flex flex-col sm:flex-row items-start sm:items-center gap-1.5 sm:gap-4 p-2 sm:p-4 md:p-6">
        <div className="bg-emerald-100 dark:bg-emerald-500/10 p-1.5 sm:p-4 rounded-xl text-emerald-600 shrink-0">
           <DollarSign className="w-4 h-4 sm:w-6 sm:h-6" />
        </div>
        <div>
          <p className="text-[9px] sm:text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest leading-tight">Est. Profit Margin</p>
          <p className="text-sm sm:text-lg md:text-2xl font-semibold text-emerald-600 mt-0.5 md:mt-1">₦{potentialProfit.toLocaleString(undefined, { minimumFractionDigits: 0 })}</p>
        </div>
      </Card>
    </div>
  );
}
