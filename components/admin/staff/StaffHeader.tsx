import { UsersRound, Zap, ShieldBan, UserPlus } from "lucide-react";

type StaffHeaderProps = {
  totalUserCount: number;
  limits: { maxStaff: number };
  usagePercentage: number;
  isNearLimit: boolean;
  isLimitReached: boolean;
  plan: string;
  isExempt?: boolean;
  handleAddNew: () => void;
};

export default function StaffHeader({
  totalUserCount,
  limits,
  usagePercentage,
  isNearLimit,
  isLimitReached,
  plan,
  isExempt,
  handleAddNew
}: StaffHeaderProps) {
  return (
    <div className="bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-[#2C2C2E] rounded-xl px-4 lg:px-6 py-4 flex items-center justify-between mb-2 shadow-sm dark:shadow-2xl relative overflow-hidden transition-colors">
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="relative z-10 flex items-center gap-4">
        <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-500/20">
          <UsersRound className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-sm lg:text-xl font-black text-gray-900 dark:text-white tracking-tight leading-none">Team</h1>
          <p className="text-[8px] lg:text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mt-1">Staff Management</p>
        </div>
      </div>

      <div className="flex items-center gap-4 px-4 bg-gray-50 dark:bg-[#252528]/50 py-1.5 rounded-xl border border-gray-200 dark:border-[#3A3A3C]/50 transition-colors">
         <div className="flex flex-col gap-1 w-24 sm:w-32">
            <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-tighter text-gray-500 dark:text-gray-400">
              <span>Usage</span>
              <span>{totalUserCount} / {limits.maxStaff === 1000000 ? '∞' : limits.maxStaff}</span>
            </div>
            <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-1000 ${isNearLimit ? 'bg-red-500' : 'bg-blue-600'}`} 
                style={{ width: `${usagePercentage}%` }} 
              />
            </div>
         </div>

         {plan === 'free' && !isExempt && (
           <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 bg-amber-50 rounded-lg border border-amber-100 animate-pulse">
              <Zap className="w-3 h-3 text-amber-600 fill-amber-600" />
              <span className="text-[8px] font-black text-amber-700 uppercase tracking-widest">Upgrade</span>
           </div>
         )}
      </div>
      
      <button
        type="button"
        onClick={handleAddNew}
        disabled={isLimitReached}
        className={`relative z-10 inline-flex items-center rounded-xl px-3 py-2 lg:px-4 lg:py-2 text-[10px] font-black shadow-sm transition-all active:scale-95 gap-2 uppercase tracking-widest ${
          isLimitReached 
            ? "bg-gray-200 dark:bg-gray-800 text-gray-500 cursor-not-allowed grayscale" 
            : "bg-gray-900 hover:bg-gray-800 text-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
        }`}
      >
        {isLimitReached ? <ShieldBan className="h-3.5 w-3.5 lg:h-4 lg:w-4" /> : <UserPlus className="h-3.5 w-3.5 lg:h-4 lg:w-4" />}
        <span className="hidden sm:inline">{isLimitReached ? "Limit Reached" : "Add Manager"}</span>
        <span className="sm:hidden">{isLimitReached ? "Full" : "Add"}</span>
      </button>
    </div>
  );
}
