import { format, parseISO } from "date-fns";
import { CheckCircle2, Calendar, ChevronRight } from "lucide-react";
import { formatCurrency } from "@/lib/format";

type DailySalesSummaryProps = {
  dateStr: string;
  data: {
    items: any[];
    revenue: number;
    expectedRevenue: number;
    isFullyApproved: boolean;
  };
  isExpanded: boolean;
  onToggle: (date: string) => void;
};

export default function DailySalesSummary({
  dateStr,
  data,
  isExpanded,
  onToggle
}: DailySalesSummaryProps) {
  return (
    <button
      onClick={() => onToggle(dateStr)}
      className="w-full px-4 lg:px-6 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-[#2C2C2E]/30 transition-colors border-b border-transparent data-[expanded=true]:border-gray-200 dark:data-[expanded=true]:border-[#2C2C2E]"
      data-expanded={isExpanded}
    >
      <div className="flex items-center gap-4">
        <div className={`p-2 rounded-lg ${data.isFullyApproved ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'}`}>
          {data.isFullyApproved ? <CheckCircle2 className="w-5 h-5" /> : <Calendar className="w-5 h-5" />}
        </div>
        <div className="text-left flex items-center gap-3">
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">{format(parseISO(dateStr), "EEEE, MMM do yyyy")}</h3>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest">{data.items.length} records</p>
          </div>
          {data.isFullyApproved ? (
            <span className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest hidden sm:flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Approved</span>
          ) : (
            <span className="bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest hidden sm:flex items-center gap-1"><Clock className="w-3 h-3"/> Pending</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-6 md:gap-10">
        <div className="md:block text-right">
          <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-tighter">Total Revenue</p>
          <p className="text-sm font-black text-emerald-600">{formatCurrency(data.revenue)}</p>
        </div>
        <div className="text-gray-400 dark:text-gray-500 ml-2">
           <ChevronRight className={`w-5 h-5 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`} />
        </div>
      </div>
    </button>
  );
}

// Sub-component for Clock icon since it's used in the JSX
function Clock({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
