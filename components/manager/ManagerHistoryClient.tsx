"use client";

import { useCallback, useState } from "react";
import { Calendar } from "lucide-react";
import ManagerHistoryRow from "./ManagerHistoryRow";

type ItemDetail = {
  id?: string;
  productId: string;
  productName: string;
  qtySold: number;
  revenue: number;
  createdAt?: string;
};

type SessionSummary = {
  id: string;
  startedAt: string;
  endedAt: string | null;
  totalRevenue: number;
  itemsCount: number;
  approvalStatus: string;
  items: ItemDetail[];
};

type DailyGroup = {
  dateStr: string;
  sessions: SessionSummary[];
  dailyTotalRevenue: number;
  dailyTotalItems: number;
  isFullyApproved: boolean;
  productBreakdown: Record<string, ItemDetail>;
};

export default function ManagerHistoryClient({
  dailyGroups,
  availableProducts = [],
}: {
  dailyGroups: DailyGroup[];
  availableProducts?: { id: string; name: string; }[];
}) {
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>(
    // Expand the first date by default
    dailyGroups.length > 0 ? { [dailyGroups[0].dateStr]: true } : {}
  );

  const toggleDate = useCallback((dateStr: string) => {
    setExpandedDates((prev) => ({
      ...prev,
      [dateStr]: !prev[dateStr],
    }));
  }, []);

  return (
    <div className="space-y-2">
      {dailyGroups.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-[#1C1C1E] lg:rounded-xl lg:shadow-sm lg:border border-slate-200 dark:border-[#2C2C2E]">
          <Calendar className="mx-auto h-12 w-12 text-slate-200 mb-4" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">No Sales History Found</h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-gray-400">Your completed sales sessions will appear here.</p>
        </div>
      ) : (
        dailyGroups.map((group) => (
          <ManagerHistoryRow 
            key={group.dateStr}
            dateStr={group.dateStr}
            sessions={group.sessions}
            dailyTotalRevenue={group.dailyTotalRevenue}
            dailyTotalItems={group.dailyTotalItems}
            isFullyApproved={group.isFullyApproved}
            productBreakdown={group.productBreakdown}
            isExpanded={!!expandedDates[group.dateStr]}
            onToggle={toggleDate}
            availableProducts={availableProducts}
          />
        ))
      )}
    </div>
  );
}
