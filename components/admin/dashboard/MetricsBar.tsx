import { Card } from "@/components/ui/Card";
import {
  AlertCircle,
  DollarSign,
  Package,
  TrendingUp,
  ShoppingBag,
  Sparkles,
} from "lucide-react";

type MetricsBarProps = {
  // Revenue
  totalRevenue: number;
  startDate: string;
  endDate: string;
  // Catalog
  productsCount: number;
  lowStockCount: number;
  // Inventory Valuation
  totalStockCost: number;
  totalRetailValue: number;
  potentialProfit: number;
};

type MetricCardProps = {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: React.ReactNode;
};

function MetricCard({ icon, iconBg, label, value }: MetricCardProps) {
  return (
    <Card
      className={`flex flex-col sm:flex-row items-start sm:items-center gap-1.5 sm:gap-4 p-2 sm:p-4 md:p-5 min-w-[130px] sm:min-w-[160px] lg:min-w-0 shrink-0 lg:shrink`}
    >
      <div className={`${iconBg} p-1.5 sm:p-3 rounded-xl shrink-0`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[9px] sm:text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest leading-tight whitespace-nowrap">
          {label}
        </p>
        <div className="text-sm sm:text-base md:text-xl font-semibold mt-0.5 truncate">
          {value}
        </div>
      </div>
    </Card>
  );
}

export default function MetricsBar({
  totalRevenue,
  startDate,
  endDate,
  productsCount,
  lowStockCount,
  totalStockCost,
  totalRetailValue,
  potentialProfit,
}: MetricsBarProps) {
  const fmt = (n: number) =>
    "₦" + n.toLocaleString(undefined, { minimumFractionDigits: 0 });

  const isToday = startDate === endDate;

  return (
    <div className="flex gap-2 md:gap-3 overflow-x-auto scrollbar-hide lg:grid lg:grid-cols-6 lg:overflow-visible pb-1 lg:pb-0">
      {/* 1 — Revenue */}
      <MetricCard
        icon={<DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />}
        iconBg="bg-blue-100 dark:bg-blue-500/10"
        label={`Revenue (${isToday ? "Today" : "Range"})`}
        value={fmt(totalRevenue)}
      />

      {/* 2 — Total Products */}
      <MetricCard
        icon={<Package className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />}
        iconBg="bg-indigo-100 dark:bg-indigo-500/10"
        label="Total Products"
        value={productsCount}
      />

      {/* 3 — Low Stock Alerts */}
      <MetricCard
        icon={
          <AlertCircle
            className={`w-4 h-4 sm:w-5 sm:h-5 ${
              lowStockCount > 0 ? "text-red-500" : "text-gray-400"
            }`}
          />
        }
        iconBg={
          lowStockCount > 0
            ? "bg-red-100 dark:bg-red-500/10"
            : "bg-gray-100 dark:bg-gray-500/10"
        }
        label="Low Stock Alerts"
        value={
          <span className={lowStockCount > 0 ? "text-red-500" : ""}>
            {lowStockCount}
          </span>
        }
      />

      {/* 4 — Stock Cost */}
      <MetricCard
        icon={<TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />}
        iconBg="bg-amber-100 dark:bg-amber-500/10"
        label="Stock Cost"
        value={fmt(totalStockCost)}
      />

      {/* 5 — Retail Value */}
      <MetricCard
        icon={<ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-sky-600" />}
        iconBg="bg-sky-100 dark:bg-sky-500/10"
        label="Retail Value"
        value={fmt(totalRetailValue)}
      />

      {/* 6 — Est. Profit Margin */}
      <MetricCard
        icon={<Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />}
        iconBg="bg-emerald-100 dark:bg-emerald-500/10"
        label="Est. Profit"
        value={
          <span className="text-emerald-600">{fmt(potentialProfit)}</span>
        }
      />
    </div>
  );
}
