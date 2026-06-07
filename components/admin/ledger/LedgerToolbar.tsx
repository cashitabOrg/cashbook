import { Activity, Key, Box } from "lucide-react";

type LedgerToolbarProps = {
  activeTab: "ALL" | "SALES" | "STOCK";
  setActiveTab: (tab: "ALL" | "SALES" | "STOCK") => void;
};

export default function LedgerToolbar({
  activeTab,
  setActiveTab
}: LedgerToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-start gap-4 p-3 bg-white dark:bg-[#1C1C1E] border-b border-gray-200 dark:border-[#2C2C2E] transition-colors">
      
      {/* Left Aspect: The Pill-Switcher Navigation */}
      <div className="flex bg-gray-50 dark:bg-[#252528] p-1 rounded-xl border border-gray-200 dark:border-[#3A3A3C] shadow-inner">
        <button 
          onClick={() => setActiveTab("ALL")}
          className={`px-4 py-1.5 text-[11px] font-black rounded-lg transition-all flex items-center gap-2
          ${activeTab === "ALL" ? "bg-blue-600 text-white shadow-lg" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"}`}
        >
          <Activity className="w-3.5 h-3.5" /> 
          ALL <span className="hidden lg:inline">MOVEMENTS</span>
        </button>

        <button 
          onClick={() => setActiveTab("SALES")}
          className={`px-4 py-1.5 text-[11px] font-black rounded-lg transition-all flex items-center gap-2
          ${activeTab === "SALES" ? "bg-emerald-600 text-white shadow-lg" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"}`}
        >
          <Key className="w-3.5 h-3.5" />
          SALES <span className="hidden lg:inline">STREAM</span>
        </button>

        <button 
          onClick={() => setActiveTab("STOCK")}
          className={`px-4 py-1.5 text-[11px] font-black rounded-lg transition-all flex items-center gap-2
          ${activeTab === "STOCK" ? "bg-amber-600 text-white shadow-lg" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"}`}
        >
          <Box className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">STOCK</span> ADJUST
        </button>
      </div>

    </div>
  );
}
