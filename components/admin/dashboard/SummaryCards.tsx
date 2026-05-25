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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Revenue Card */}
      <Card className="flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-4xl md:text-5xl font-semibold mb-2">
              ₦
              {totalRevenue.toLocaleString(undefined, {
                minimumFractionDigits: 0,
              })}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Revenue ({startDate === endDate ? "Today" : "Range"})
            </p>
          </div>
        </div>
      </Card>

      {/* Products Card */}
      <Card className="flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-4xl md:text-5xl font-semibold mb-2">
              {productsCount}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Total Products in Catalog
            </p>
          </div>
        </div>
      </Card>

      {/* Low Stock Card */}
      <Card className="flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-4xl md:text-5xl font-semibold mb-2 flex items-center gap-3">
              {lowStockCount}
              {lowStockCount > 0 && (
                <AlertCircle className="h-8 w-8 text-red-500 fill-red-500/20" />
              )}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Products requiring attention
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
