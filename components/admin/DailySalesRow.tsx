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
    <div className="bg-slate-900 border border-slate-800 lg:rounded-xl shadow-2xl overflow-hidden mb-3">
      <DailySalesSummary 
        dateStr={dateStr}
        data={data}
        isExpanded={isExpanded}
        onToggle={onToggle}
        variance={variance}
      />

      {isExpanded && (
        <div className="p-2 lg:p-4 bg-slate-950/30 animate-in slide-in-from-top-2 duration-300">
          {!data.isFullyApproved && (
            <DailySalesApproval 
              dateStr={dateStr}
              approvingDate={approvingDate}
              onApprove={onApprove}
            />
          )}

          <DailySalesPerformance sortedPerf={intelligence.sortedPerf} />

          {/* Tab Switcher */}
          <div className="flex bg-slate-800 p-1 rounded-xl mb-4 w-fit border border-slate-700">
            <button
              onClick={() => setActiveSubTab("logs")}
              className={`px-4 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
                activeSubTab === "logs" ? "bg-slate-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
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
                activeSubTab === "intel" ? "bg-slate-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
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
        </div>
      )}
    </div>
  );
});

export default DailySalesRow;
