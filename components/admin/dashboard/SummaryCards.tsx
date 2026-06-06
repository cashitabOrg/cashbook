import { Card } from "@/components/ui/Card";
import { AlertCircle, DollarSign, Package } from "lucide-react";

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
  lowStockCount,
}: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-3 gap-2 md:gap-6">
      {/* Revenue Card */}
      <Card className="flex flex-col sm:flex-row items-start sm:items-center gap-1.5 sm:gap-4 p-2 sm:p-4 md:p-6">
        <div className="bg-blue-100 dark:bg-blue-500/10 p-1.5 sm:p-4 rounded-xl text-blue-600 shrink-0">
           <DollarSign className="w-4 h-4 sm:w-6 sm:h-6" />
        </div>
        <div>
          <p className="text-[9px] sm:text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest leading-tight">
            Revenue ({startDate === endDate ? "Today" : "Range"})
          </p>
          <p className="text-sm sm:text-lg md:text-2xl font-semibold mt-0.5 md:mt-1">
            ₦{totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 0 })}
          </p>
        </div>
      </Card>

      {/* Products Card */}
      <Card className="flex flex-col sm:flex-row items-start sm:items-center gap-1.5 sm:gap-4 p-2 sm:p-4 md:p-6">
        <div className="bg-indigo-100 dark:bg-indigo-500/10 p-1.5 sm:p-4 rounded-xl text-indigo-600 shrink-0">
           <Package className="w-4 h-4 sm:w-6 sm:h-6" />
        </div>
        <div>
          <p className="text-[9px] sm:text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest leading-tight">
            Total Products
          </p>
          <p className="text-sm sm:text-lg md:text-2xl font-semibold mt-0.5 md:mt-1">
            {productsCount}
          </p>
        </div>
      </Card>

      {/* Low Stock Card */}
      <Card className="flex flex-col sm:flex-row items-start sm:items-center gap-1.5 sm:gap-4 p-2 sm:p-4 md:p-6">
        <div className={`p-1.5 sm:p-4 rounded-xl shrink-0 ${lowStockCount > 0 ? "bg-red-100 dark:bg-red-500/10 text-red-600 animate-pulse" : "bg-gray-100 dark:bg-gray-500/10 text-gray-500"}`}>
           <AlertCircle className="w-4 h-4 sm:w-6 sm:h-6" />
        </div>
        <div>
          <p className="text-[9px] sm:text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest leading-tight">
            Low Stock Alerts
          </p>
          <p className={`text-sm sm:text-lg md:text-2xl font-semibold mt-0.5 md:mt-1 ${lowStockCount > 0 ? "text-red-500 font-bold" : ""}`}>
            {lowStockCount}
          </p>
        </div>
      </Card>
    </div>
  );
}
