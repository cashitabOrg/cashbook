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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="flex items-center gap-4">
        <div className="bg-amber-100 dark:bg-amber-500/10 p-4 rounded-xl text-amber-600">
           <TrendingUp className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Stock Cost</p>
          <p className="text-2xl font-semibold mt-1">₦{totalStockCost.toLocaleString(undefined, { minimumFractionDigits: 0 })}</p>
        </div>
      </Card>
      
      <Card className="flex items-center gap-4">
        <div className="bg-blue-100 dark:bg-blue-500/10 p-4 rounded-xl text-blue-600">
           <Package className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Retail Value</p>
          <p className="text-2xl font-semibold mt-1">₦{totalRetailValue.toLocaleString(undefined, { minimumFractionDigits: 0 })}</p>
        </div>
      </Card>

      <Card className="flex items-center gap-4">
        <div className="bg-emerald-100 dark:bg-emerald-500/10 p-4 rounded-xl text-emerald-600">
           <DollarSign className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Est. Profit Margin</p>
          <p className="text-2xl font-semibold text-emerald-600 mt-1">₦{potentialProfit.toLocaleString(undefined, { minimumFractionDigits: 0 })}</p>
        </div>
      </Card>
    </div>
  );
}
