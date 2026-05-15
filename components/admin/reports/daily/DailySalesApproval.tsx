type DailySalesApprovalProps = {
  dateStr: string;
  approvingDate: string | null;
  onApprove: (date: string) => void;
};

export default function DailySalesApproval({
  dateStr,
  approvingDate,
  onApprove
}: DailySalesApprovalProps) {
  return (
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
  );
}
