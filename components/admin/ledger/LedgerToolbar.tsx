import { Activity, Key, Box, PackageSearch, Search } from "lucide-react";

type LedgerToolbarProps = {
  activeTab: "ALL" | "SALES" | "STOCK";
  setActiveTab: (tab: "ALL" | "SALES" | "STOCK") => void;
  selectedProduct: string;
  setSelectedProduct: (val: string) => void;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  products: any[];
};

export default function LedgerToolbar({
  activeTab,
  setActiveTab,
  selectedProduct,
  setSelectedProduct,
  searchQuery,
  setSearchQuery,
  products
}: LedgerToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 p-3 bg-white dark:bg-[#1C1C1E] border-b border-gray-200 dark:border-[#2C2C2E] transition-colors">
      
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

      {/* Right Aspect: Integrated Filters */}
      <div className="flex-1 flex items-center gap-3 min-w-[300px]">
        {/* Product Isolation Dropdown */}
        <div className="relative w-48 shrink-0">
          <PackageSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 dark:text-gray-500 pointer-events-none" />
          <select 
            value={selectedProduct} 
            onChange={(e) => setSelectedProduct(e.target.value)}
            className="w-full bg-white dark:bg-[#252528] border border-gray-200 dark:border-[#3A3A3C] rounded-xl pl-9 pr-4 py-1.5 text-[11px] font-bold text-gray-700 dark:text-gray-300 outline-none focus:border-blue-500/50 transition-all appearance-none cursor-pointer"
          >
            <option value="ALL">Entire Catalog</option>
            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        {/* Deep Search Field */}
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 group-focus-within:text-blue-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Search history, staff, or notes..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-[#252528] border border-gray-200 dark:border-[#3A3A3C] rounded-xl pl-11 pr-4 py-1.5 text-[11px] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:border-blue-500/50 transition-all font-mono"
          />
        </div>
      </div>
    </div>
  );
}
