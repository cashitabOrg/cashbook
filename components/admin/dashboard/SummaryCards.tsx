import { Card } from "@/components/ui/Card";
import { AlertCircle } from "lucide-react";

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
      <Card className="flex flex-col justify-between p-2 sm:p-4 md:p-6">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-lg sm:text-2xl md:text-4xl lg:text-5xl font-semibold mb-1 md:mb-2">
              ₦
              {totalRevenue.toLocaleString(undefined, {
                minimumFractionDigits: 0,
              })}
            </div>
            <p className="text-[10px] sm:text-xs md:text-sm text-gray-500 dark:text-gray-400 leading-tight">
              Revenue ({startDate === endDate ? "Today" : "Range"})
            </p>
          </div>
        </div>
      </Card>

      {/* Products Card */}
      <Card className="flex flex-col justify-between p-2 sm:p-4 md:p-6">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-lg sm:text-2xl md:text-4xl lg:text-5xl font-semibold mb-1 md:mb-2">
              {productsCount}
            </div>
            <p className="text-[10px] sm:text-xs md:text-sm text-gray-500 dark:text-gray-400 leading-tight">
              Total Products in Catalog
            </p>
          </div>
        </div>
      </Card>

      {/* Low Stock Card */}
      <Card className="flex flex-col justify-between p-2 sm:p-4 md:p-6">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-lg sm:text-2xl md:text-4xl lg:text-5xl font-semibold mb-1 md:mb-2 flex items-center gap-1.5 md:gap-3">
              {lowStockCount}
              {lowStockCount > 0 && (
                <AlertCircle className="h-4 w-4 md:h-8 md:w-8 text-red-500 fill-red-500/20 shrink-0" />
              )}
            </div>
            <p className="text-[10px] sm:text-xs md:text-sm text-gray-500 dark:text-gray-400 leading-tight">
              Products requiring attention
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
