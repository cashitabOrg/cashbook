import { format, parseISO } from "date-fns";
import { CheckCircle2, Calendar, ChevronRight } from "lucide-react";

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
  variance: number;
};

export default function DailySalesSummary({
  dateStr,
  data,
  isExpanded,
  onToggle,
  variance
}: DailySalesSummaryProps) {
  return (
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
