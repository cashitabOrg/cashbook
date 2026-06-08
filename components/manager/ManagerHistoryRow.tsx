"use client";

import { useMemo, memo } from "react";
import { format, parseISO } from "date-fns";
import { useRouter } from "next/navigation";
import HistoryRowHeader from "./history/HistoryRowHeader";
import HistoryPerformance from "./history/HistoryPerformance";
import HistoryTransactionLog from "./history/HistoryTransactionLog";
import { formatCurrency } from "@/lib/format";

interface ItemDetail {
  id?: string;
  productId: string;
  productName: string;
  qtySold: number;
  revenue: number;
  createdAt?: string;
  isDeleted?: boolean;
}

interface SessionSummary {
  id: string;
  startedAt: string;
  endedAt: string | null;
  totalRevenue: number;
  itemsCount: number;
  approvalStatus: string;
  items: ItemDetail[];
}

interface ManagerHistoryRowProps {
  dateStr: string;
  sessions: SessionSummary[];
  dailyTotalRevenue: number;
  dailyTotalItems: number;
  isFullyApproved: boolean;
  productBreakdown: Record<string, ItemDetail>;
  isExpanded: boolean;
  onToggle: (dateStr: string) => void;
  availableProducts: { id: string; name: string; }[];
}

const ManagerHistoryRow = memo(function ManagerHistoryRow({
  dateStr,
  sessions,
  dailyTotalRevenue,
  dailyTotalItems,
  isFullyApproved,
  productBreakdown,
  isExpanded,
  onToggle,
  availableProducts
}: ManagerHistoryRowProps) {
  const router = useRouter();

  // LAZY CALCULATIONS
  const processedData = useMemo(() => {
    if (!isExpanded) return { dailyHistoryItems: [], breakdownArray: [], topProduct: null };

    const breakdownArray = Object.values(productBreakdown).sort((a, b) => b.revenue - a.revenue);
    
    const topProduct = breakdownArray.length > 0 
      ? breakdownArray.reduce((prev, curr) => (curr.qtySold > prev.qtySold ? curr : prev))
      : null;
      
    const dailyHistoryItems = sessions.flatMap(session => 
      session.items.map(item => ({
        id: item.id || '',
        time: format(parseISO(item.createdAt || session.startedAt), "HH:mm"),
        timestamp: new Date(item.createdAt || session.startedAt).getTime(),
        productId: item.productId,
        productName: item.productName,
        qty: item.qtySold,
        revenue: item.revenue,
        isApproved: session.approvalStatus === 'approved',
        isDeleted: item.isDeleted || false
      }))
    ).sort((a, b) => a.timestamp - b.timestamp);

    return { dailyHistoryItems, breakdownArray, topProduct };
  }, [isExpanded, sessions, productBreakdown]);

  return (
    <div className="bg-white dark:bg-[#1C1C1E] lg:rounded-xl lg:shadow-sm lg:border border-slate-200 dark:border-[#2C2C2E] overflow-hidden transition-all duration-200 mb-2">
      <HistoryRowHeader 
        dateStr={dateStr}
        sessionsCount={sessions.length}
        dailyTotalRevenue={dailyTotalRevenue}
        dailyTotalItems={dailyTotalItems}
        isFullyApproved={isFullyApproved}
        isExpanded={isExpanded}
        onToggle={onToggle}
      />

      {/* Expandable Content */}
      {isExpanded && (
        <div className="border-t border-slate-100 dark:border-[#2C2C2E] bg-slate-50 dark:bg-[#252528]/50 p-3 animate-in slide-in-from-top-2 duration-300">
          {/* Mobile Stats */}
          <div className="flex sm:hidden justify-between mb-3 bg-white dark:bg-[#1C1C1E] px-3 py-2 rounded-lg border border-slate-200 dark:border-[#2C2C2E] shadow-sm">
            <div>
              <p className="text-[10px] text-slate-500 dark:text-gray-400 uppercase tracking-wider">Revenue</p>
              <p className="font-bold text-sm text-emerald-600 dark:text-emerald-400">{formatCurrency(dailyTotalRevenue)}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-slate-500 dark:text-gray-400 uppercase tracking-wider">Items Sold</p>
              <p className="font-bold text-sm text-slate-900 dark:text-white">{dailyTotalItems.toFixed(2)}</p>
            </div>
          </div>

          <HistoryPerformance breakdownArray={processedData.breakdownArray} />

          <HistoryTransactionLog 
            dailyHistoryItems={processedData.dailyHistoryItems}
            availableProducts={availableProducts}
            onSuccess={() => router.refresh()}
          />
        </div>
      )}
    </div>
  );
});

export default ManagerHistoryRow;
