import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  Table,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { Loader2, Maximize2, TrendingUp, ChevronDown } from "lucide-react";
import { formatCurrency } from "@/lib/format";

const PAGE_SIZE = 10;

type PerformanceTableProps = {
  topProducts: {
    id: string;
    name: string;
    total_qty_sold: number;
    total_revenue: number;
  }[];
  onExpand: () => void;
  isLoading?: boolean;
};

export default function PerformanceTable({
  topProducts,
  onExpand,
  isLoading = false,
}: PerformanceTableProps) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Reset pagination when data source changes (date range switch)
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [topProducts]);

  const visibleProducts = topProducts.slice(0, visibleCount);
  const hasMore = topProducts.length > visibleCount;
  const remaining = topProducts.length - visibleCount;

  return (
    <Card className="flex flex-col h-[450px] p-0 overflow-hidden">
      <CardHeader className="px-3 py-3 md:px-6 md:py-4 border-b border-gray-100 dark:border-[#2C2C2E] flex flex-row justify-between items-center mb-0 bg-gray-50 dark:bg-[#252528]/50">
        <div>
          <CardTitle>My Sales</CardTitle>
          <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
            Sales breakdown for selected range.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isLoading ? (
            <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
          ) : (
            <TrendingUp className="w-5 h-5 text-blue-500" />
          )}
          <button
            onClick={onExpand}
            className="p-1.5 text-gray-500 hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors"
            title="Expand table"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </CardHeader>

      <div className="flex-1 overflow-auto p-2 md:p-4 scrollbar-hide md:custom-scrollbar">
        {isLoading ? (
          /* Loading skeleton */
          <div className="space-y-2 animate-pulse pt-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-2 py-2.5 rounded-lg"
              >
                <div className="w-5 h-3 bg-gray-200 dark:bg-[#3A3A3C] rounded" />
                <div className="flex-1 h-3 bg-gray-200 dark:bg-[#3A3A3C] rounded" />
                <div className="w-12 h-3 bg-gray-200 dark:bg-[#3A3A3C] rounded" />
                <div className="w-20 h-3 bg-gray-200 dark:bg-[#3A3A3C] rounded" />
              </div>
            ))}
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="border-none hover:bg-transparent">
                  <TableHead className="w-8 sm:w-12">SN</TableHead>
                  <TableHead>Product Name</TableHead>
                  <TableHead className="text-right">Units Sold</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <tbody>
                {topProducts.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="py-12 text-center text-gray-500 italic"
                    >
                      No sales found matching search/dates.
                    </TableCell>
                  </TableRow>
                ) : (
                  visibleProducts.map((p, idx) => (
                    <TableRow key={p.id}>
                      <TableCell className="text-xs text-gray-400 font-mono">
                        {idx + 1}
                      </TableCell>
                      <TableCell className="font-semibold">{p.name}</TableCell>
                      <TableCell className="text-right font-mono">
                        {p.total_qty_sold.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-emerald-500">
                        {formatCurrency(Number(p.total_revenue))}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </tbody>
            </Table>

            {/* Load More button */}
            {hasMore && (
              <div className="mt-3 flex justify-center border-t border-gray-100 dark:border-[#2C2C2E] pt-3">
                <button
                  onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                  className="flex items-center gap-1.5 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors border border-blue-200 dark:border-blue-500/20"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                  Load More — {remaining} more product{remaining !== 1 ? "s" : ""}
                </button>
              </div>
            )}

            {/* Item count badge */}
            {topProducts.length > 0 && (
              <p className="mt-2 text-center text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                Showing {Math.min(visibleCount, topProducts.length)} of {topProducts.length} products
              </p>
            )}
          </>
        )}
      </div>
    </Card>
  );
}
