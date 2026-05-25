"use client";

import { useMemo, useState, memo } from "react";
import { ShieldBan } from "lucide-react";
import { toast } from "sonner";
import DailySalesSummary from "./reports/daily/DailySalesSummary";
import DailySalesApproval from "./reports/daily/DailySalesApproval";
import DailySalesPerformance from "./reports/daily/DailySalesPerformance";
import DailySalesIntelTable from "./reports/daily/DailySalesIntelTable";
import DailySalesLogsTable from "./reports/daily/DailySalesLogsTable";

interface SaleRecord {
  id: string;
  timestamp: string;
  managerName: string;
  productName: string;
  qty: number;
  price: number;
  revenue: number;
  cost: number;
  profit: number;
  approvalStatus?: string;
  isDeleted?: boolean;
}

interface DailySalesRowProps {
  dateStr: string;
  data: {
    items: SaleRecord[];
    revenue: number;
    expectedRevenue: number;
    qty: number;
    isFullyApproved: boolean;
  };
  isExpanded: boolean;
  onToggle: (key: string) => void;
  plan: string;
  isExempt?: boolean;
  storeId: string;
  approvingDate: string | null;
  onApprove: (date: string) => void;
}

const DailySalesRow = memo(function DailySalesRow({
  dateStr,
  data,
  isExpanded,
  onToggle,
  plan,
  isExempt,
  approvingDate,
  onApprove
}: DailySalesRowProps) {
  
  // LAZY CALCULATIONS: These only run when expanded
  const intelligence = useMemo(() => {
    if (!isExpanded) return { sortedIntel: [], sortedPerf: [], subTab: "logs" };

    const productSummary: Record<string, any> = {};
    data.items.forEach(item => {
      if (!productSummary[item.productName]) {
        productSummary[item.productName] = { 
          qty: 0, 
          recordedRevenue: 0, 
          expectedRevenue: 0,
          unitPrice: item.price,
          unitCost: item.cost
        };
      }
      if (!item.isDeleted) {
        productSummary[item.productName].qty += item.qty;
        productSummary[item.productName].recordedRevenue += item.revenue;
        productSummary[item.productName].expectedRevenue += item.qty * item.price;
      }
    });

    const sortedIntel = Object.entries(productSummary)
      .map(([name, stats]) => ({ name, ...stats, variance: stats.recordedRevenue - stats.expectedRevenue }))
      .sort((a, b) => b.recordedRevenue - a.recordedRevenue);

    const sortedPerf = sortedIntel.map(s => ({ name: s.name, qty: s.qty, revenue: s.recordedRevenue }));

    return { sortedIntel, sortedPerf };
  }, [isExpanded, data.items]);

  const [activeSubTab, setActiveSubTab] = useState<"logs" | "intel">("logs");

  const variance = data.revenue - data.expectedRevenue;

  return (
    <div className="bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-[#2C2C2E] lg:rounded-xl shadow-sm dark:shadow-2xl overflow-hidden mb-3 transition-colors">
      <DailySalesSummary 
        dateStr={dateStr}
        data={data}
        isExpanded={isExpanded}
        onToggle={onToggle}
        variance={variance}
      />

      {isExpanded && (
        <div className="p-2 lg:p-4 bg-gray-50/50 dark:bg-[#252528]/30 animate-in slide-in-from-top-2 duration-300 border-t border-gray-200 dark:border-[#2C2C2E]">
          {!data.isFullyApproved && (
            <DailySalesApproval 
              dateStr={dateStr}
              approvingDate={approvingDate}
              onApprove={onApprove}
            />
          )}

          <DailySalesPerformance sortedPerf={intelligence.sortedPerf} />

          {/* Tab Switcher */}
          <div className="flex bg-gray-100 dark:bg-[#2C2C2E] p-1 rounded-xl mb-4 w-fit border border-gray-200 dark:border-[#3A3A3C]">
            <button
              onClick={() => setActiveSubTab("logs")}
              className={`px-4 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
                activeSubTab === "logs" ? "bg-white dark:bg-[#3A3A3C] text-gray-900 dark:text-white shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              Sales Logs
            </button>
            <button
              onClick={() => {
                if (plan === 'free' && !isExempt) {
                  toast.error("Upgrade to Basic or Pro to unlock Sales Intelligence.");
                  return;
                }
                setActiveSubTab("intel");
              }}
              className={`px-4 py-1.5 text-[10px] font-bold rounded-lg transition-all relative ${
                activeSubTab === "intel" ? "bg-white dark:bg-[#3A3A3C] text-gray-900 dark:text-white shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              Sales Intelligence
              {plan === 'free' && !isExempt && <ShieldBan className="w-2.5 h-2.5 text-amber-500 absolute top-0 right-1" />}
            </button>
          </div>

          {activeSubTab === "intel" ? (
             <DailySalesIntelTable sortedIntel={intelligence.sortedIntel} />
          ) : (
             <DailySalesLogsTable items={data.items} />
          )}
        </div>
      )}
    </div>
  );
});

export default DailySalesRow;
