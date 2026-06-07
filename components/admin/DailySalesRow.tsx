"use client";

import { useMemo, memo } from "react";
import { ShieldBan, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import DailySalesSummary from "./reports/daily/DailySalesSummary";
import DailySalesPerformance from "./reports/daily/DailySalesPerformance";
import DailySalesLogsTable from "./reports/daily/DailySalesLogsTable";
import { formatCurrency } from "@/lib/format";

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
    sessions?: Record<string, {
      id: string;
      managerName: string;
      approvalStatus: string;
      revenue: number;
      expectedRevenue: number;
      qty: number;
      startedAt: string;
    }>;
  };
  isExpanded: boolean;
  onToggle: (key: string) => void;
  plan: string;
  isExempt?: boolean;
  storeId: string;
  approvingDate: string | null;
  onApprove: (date: string) => void;
  approvingSessionId?: string | null;
  onApproveSession?: (sessionId: string, dateStr: string) => void;
}

const DailySalesRow = memo(function DailySalesRow({
  dateStr,
  data,
  isExpanded,
  onToggle,
  plan,
  isExempt,
  approvingDate,
  onApprove,
  approvingSessionId = null,
  onApproveSession = () => {}
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

  const sessionsList = data.sessions ? Object.values(data.sessions) : [];

  return (
    <div className="bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-[#2C2C2E] lg:rounded-xl shadow-sm dark:shadow-2xl overflow-hidden mb-3 transition-colors">
      <DailySalesSummary 
        dateStr={dateStr}
        data={data}
        isExpanded={isExpanded}
        onToggle={onToggle}
      />

      {isExpanded && (
        <div className="p-2 lg:p-4 bg-gray-50/50 dark:bg-[#252528]/30 animate-in slide-in-from-top-2 duration-300 border-t border-gray-200 dark:border-[#2C2C2E]">
          
          {/* Daily Sections Approval Grid */}
          {sessionsList.length > 0 && (
            <div className="mb-6 bg-gray-100/30 dark:bg-[#1E1E20]/50 border border-gray-200/50 dark:border-[#2C2C2E] p-4 rounded-2xl shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 border-b border-gray-200/50 dark:border-[#2C2C2E]/60 pb-3 gap-2">
                <div>
                  <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider">
                    Daily Shifts & Sections
                  </h4>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">
                    Approve individual manager sessions to lock their records permanently.
                  </p>
                </div>
                {!data.isFullyApproved && (
                  <button
                    onClick={() => onApprove(dateStr)}
                    disabled={approvingDate === dateStr}
                    className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-blue-400 disabled:to-indigo-400 text-white text-[10px] font-black rounded-lg transition-all shadow-sm uppercase tracking-wider w-full sm:w-auto"
                  >
                    {approvingDate === dateStr ? 'Approving all...' : 'Approve All Sections'}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {sessionsList.map((session: any) => {
                  const isSessApproved = session.approvalStatus === 'approved';
                  return (
                    <div 
                      key={session.id}
                      className="bg-white dark:bg-[#1C1C1E] border border-gray-150 dark:border-[#2C2C2E] p-3.5 rounded-xl shadow-sm flex flex-col justify-between transition-all hover:shadow-md hover:scale-[1.01] hover:border-gray-300 dark:hover:border-[#3A3A3C] duration-200"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-[9px] font-black text-gray-400 dark:text-gray-500 font-mono tracking-wider">
                            {format(parseISO(session.startedAt), "hh:mm a")} WAT
                          </span>
                          <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                            isSessApproved 
                              ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-500/20'
                              : 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200/60 dark:border-amber-500/20 animate-pulse'
                          }`}>
                            {isSessApproved ? 'Approved' : 'Pending'}
                          </span>
                        </div>
                        <h5 className="text-[12px] font-black text-gray-900 dark:text-white mb-1.5 truncate">
                          {session.managerName}
                        </h5>
                      </div>

                      <div className="border-t border-gray-50 dark:border-[#252528] pt-2.5 mt-2 flex items-center justify-between gap-2">
                        <div>
                          <div className="text-[9px] text-gray-400 dark:text-gray-500 font-medium">Revenue</div>
                          <div className="text-[11px] font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(session.revenue)}</div>
                        </div>

                        {isSessApproved ? (
                          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Approved
                          </div>
                        ) : (
                          <button
                            onClick={() => onApproveSession(session.id, dateStr)}
                            disabled={approvingSessionId === session.id}
                            className="px-2.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white text-[10px] font-bold rounded-lg transition-all shadow-sm tracking-wide"
                          >
                            {approvingSessionId === session.id ? 'Approving...' : 'Approve Section'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <DailySalesPerformance sortedPerf={intelligence.sortedPerf} />

          <DailySalesLogsTable items={data.items} />
        </div>
      )}
    </div>
  );
});

export default DailySalesRow;
