"use client";

import { useMemo, useState, memo } from "react";
import { format, parseISO } from "date-fns";
import { ChevronRight, Calendar, CheckCircle2, Clock, TrendingUp, ShieldBan } from "lucide-react";
import { toast } from "sonner";

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
      productSummary[item.productName].qty += item.qty;
      productSummary[item.productName].recordedRevenue += item.revenue;
      productSummary[item.productName].expectedRevenue += item.qty * item.price;
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
      <button
        onClick={() => onToggle(dateStr)}
        className="w-full px-4 lg:px-6 py-3 flex items-center justify-between hover:bg-slate-800/30 transition-colors border-b border-transparent data-[expanded=true]:border-slate-800"
        data-expanded={isExpanded}
      >
        <div className="flex items-center gap-4">
          <div className={`p-2 rounded-lg ${data.isFullyApproved ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
            {data.isFullyApproved ? <CheckCircle2 className="w-5 h-5" /> : <Calendar className="w-5 h-5" />}
          </div>
          <div className="text-left flex items-center gap-3">
            <div>
              <h3 className="text-sm font-bold text-white">{format(parseISO(dateStr), "EEEE, MMM do yyyy")}</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{data.items.length} records</p>
            </div>
            {data.isFullyApproved ? (
              <span className="bg-emerald-100 text-emerald-700 border border-emerald-200 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest hidden sm:flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Approved</span>
            ) : (
              <span className="bg-amber-100 text-amber-700 border border-amber-200 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest hidden sm:flex items-center gap-1"><Clock className="w-3 h-3"/> Pending</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-6 md:gap-10">
          <div className="hidden md:block text-right">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Variance (Audit)</p>
            <p className={`text-sm font-black ${variance < -1 ? 'text-rose-600' : 'text-emerald-600'}`}>
              { variance < -1 ? `₦${variance.toFixed(2)}` : 'MATCH' }
            </p>
          </div>
          <div className="md:block text-right">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Total Revenue</p>
            <p className="text-sm font-black text-emerald-600">₦{data.revenue.toFixed(2)}</p>
          </div>
          <div className="text-slate-400 ml-2">
             <ChevronRight className={`w-5 h-5 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`} />
          </div>
        </div>
      </button>

      {isExpanded && (
        <div className="p-2 lg:p-4 bg-slate-950/30 animate-in slide-in-from-top-2 duration-300">
          {!data.isFullyApproved && (
            <div className="mb-4 flex flex-col sm:flex-row items-center justify-between bg-slate-800 border border-amber-500/30 p-4 rounded-xl shadow-sm">
              <div>
                 <h4 className="text-xs font-bold text-white">Approve Sales for {dateStr}</h4>
                 <p className="text-[11px] text-slate-400">Approving these records will permanently lock them.</p>
              </div>
              <button 
                 onClick={() => onApprove(dateStr)}
                 disabled={approvingDate === dateStr}
                 className="mt-3 sm:mt-0 w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-[11px] font-bold rounded-lg transition-colors shadow-sm whitespace-nowrap"
              >
                 {approvingDate === dateStr ? 'Approving...' : 'Approve Daily Sales'}
              </button>
            </div>
          )}

          {/* Performance Summary Grid */}
          <div className="mb-6">
             <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1 flex items-center gap-2">
               <TrendingUp className="w-3 h-3 text-blue-500" />
               Product Performance Summary
             </h4>
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
               {intelligence.sortedPerf.map((item: any) => (
                 <div key={item.name} className="bg-slate-800 border border-slate-700 rounded-lg p-2.5 flex flex-col justify-between hover:border-blue-500/30 transition-colors shadow-sm">
                    <span className="text-[11px] font-bold text-slate-200 truncate mb-1" title={item.name}>{item.name}</span>
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-slate-500 font-mono italic">{item.qty.toFixed(2)} qty</span>
                      <span className="text-emerald-600 font-black">₦{item.revenue.toFixed(2)}</span>
                    </div>
                 </div>
               ))}
             </div>
          </div>

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
             <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-sm overflow-hidden animate-in fade-in duration-300">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-800">
                     <thead>
                        <tr className="bg-slate-900/50 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                          <th className="py-2.5 px-4 text-left">Product</th>
                          <th className="py-2.5 px-4 text-right">Qty Sold</th>
                          <th className="py-2.5 px-4 text-right">Selling Price</th>
                          <th className="py-2.5 px-4 text-right">Manager Sales</th>
                          <th className="py-2.5 px-4 text-right pr-6">Audited Variance</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-800">
                        {intelligence.sortedIntel.map((stats: any) => (
                          <tr key={stats.name} className="text-[11px] hover:bg-slate-700/50 transition-colors">
                            <td className="py-3 px-4 font-bold text-slate-200">{stats.name}</td>
                            <td className="py-3 px-4 text-right text-slate-400 font-mono">{stats.qty.toFixed(2)}</td>
                            <td className="py-3 px-4 text-right text-slate-500 font-mono italic">₦{stats.unitPrice.toFixed(2)}</td>
                            <td className="py-3 px-4 text-right font-bold text-slate-200">₦{stats.recordedRevenue.toFixed(2)}</td>
                            <td className={`py-3 px-4 text-right font-black pr-6 ${stats.variance < -1 ? 'text-rose-600' : stats.variance > 1 ? 'text-emerald-600' : 'text-slate-400'}`}>
                              {stats.variance < -1 ? `-₦${Math.abs(stats.variance).toFixed(2)}` : stats.variance > 1 ? `+₦${stats.variance.toFixed(2)}` : 'MATCH'}
                            </td>
                          </tr>
                        ))}
                     </tbody>
                  </table>
                </div>
             </div>
          ) : (
             <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-sm animate-in fade-in duration-300 text-left">
                <div className="overflow-x-auto">
                   <table className="min-w-full divide-y divide-slate-800 text-left">
                      <thead>
                        <tr className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-900/50 text-left">
                          <th className="py-2 px-4 w-12 text-left">SN</th>
                          <th className="py-2 px-4 text-left">Time</th>
                          <th className="py-2 px-4 text-left">Manager</th>
                          <th className="py-2 px-4 text-left">Product</th>
                          <th className="py-2 px-4 text-right">Sold</th>
                          <th className="py-2 px-4 text-right pr-6">Revenue</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {data.items.map((sale, idx) => (
                          <tr key={sale.id} className="hover:bg-slate-700/50 text-[11px] transition-colors">
                            <td className="py-2 px-4 text-slate-500 font-mono italic">{idx + 1}</td>
                            <td className="py-2 px-4 text-slate-400 font-medium">{format(parseISO(sale.timestamp), "HH:mm")}</td>
                            <td className="py-2 px-4 font-bold text-slate-300">{sale.managerName}</td>
                            <td className="py-2 px-4 font-medium text-slate-200">{sale.productName}</td>
                            <td className="py-2 px-4 text-slate-400 text-right font-mono">{sale.qty.toFixed(2)}</td>
                            <td className="py-2 px-4 font-black text-emerald-600 text-right pr-6">₦{sale.revenue.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                   </table>
                </div>
             </div>
          )}
        </div>
      )}
    </div>
  );
});

export default DailySalesRow;
