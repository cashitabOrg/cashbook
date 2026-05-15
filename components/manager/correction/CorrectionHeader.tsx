import { ShoppingCart } from "lucide-react";

type CorrectionHeaderProps = {
  targetDate: string;
  setTargetDate: (val: string) => void;
  availableDates: string[];
  totalItems: number;
  totalRevenue: number;
  handleAtomicSubmit: () => void;
  isSubmitting: boolean;
  rowCount: number;
};

export default function CorrectionHeader({
  targetDate,
  setTargetDate,
  availableDates,
  totalItems,
  totalRevenue,
  handleAtomicSubmit,
  isSubmitting,
  rowCount
}: CorrectionHeaderProps) {
  return (
    <>
      <div className="bg-purple-700 text-white text-center py-2 font-black tracking-widest text-sm uppercase rounded-b-xl -mt-6 mb-4 shadow-md flex items-center justify-center gap-4">
        <span>Developer Mode: Atomic Retroactive Entry for</span>
        <select 
          value={targetDate} 
          onChange={(e) => setTargetDate(e.target.value)} 
          className="text-slate-900 px-3 py-1 rounded text-xs font-bold w-40 border-2 border-purple-400 focus:outline-none focus:ring focus:ring-purple-200"
        >
          {availableDates.length === 0 ? (
             <option value="2026-04-05">2026-04-05</option>
          ) : (
            availableDates.map(date => (
              <option key={date} value={date}>{date}</option>
            ))
          )}
        </select>
      </div>

      <div className="bg-white lg:rounded-xl shadow-sm border-2 border-purple-200 p-4 lg:p-6 mb-2 lg:mb-6 flex flex-wrap gap-4 justify-between items-center">
        <div className="flex gap-4 lg:gap-8 items-center">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Items</p>
            <p className="text-xl lg:text-2xl font-black text-slate-900">{totalItems.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Session Revenue</p>
            <p className="text-xl lg:text-2xl font-black text-purple-600">₦{totalRevenue.toFixed(2)}</p>
          </div>
        </div>
        
        <button
          onClick={handleAtomicSubmit}
          disabled={isSubmitting || rowCount === 0}
          className="inline-flex items-center rounded-xl bg-purple-900 px-4 py-2 sm:px-6 sm:py-3 text-[10px] sm:text-lg font-black text-white shadow-lg hover:bg-rose-600 transition-colors disabled:opacity-50 gap-2 uppercase tracking-widest animate-pulse"
        >
          <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
          {isSubmitting ? "OVERWRITING DATE..." : "WIPE & INJECT DATA"}
        </button>
      </div>
    </>
  );
}
