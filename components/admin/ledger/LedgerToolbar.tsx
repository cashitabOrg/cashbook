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
    <div className="flex flex-wrap items-center justify-between gap-4 p-3 bg-slate-900 border-b border-slate-800">
      
      {/* Left Aspect: The Pill-Switcher Navigation */}
      <div className="flex bg-slate-950/80 p-1 rounded-xl border border-slate-800/60 shadow-inner">
        <button 
          onClick={() => setActiveTab("ALL")}
          className={`px-4 py-1.5 text-[11px] font-black rounded-lg transition-all flex items-center gap-2
          ${activeTab === "ALL" ? "bg-blue-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"}`}
        >
          <Activity className="w-3.5 h-3.5" /> 
          ALL <span className="hidden lg:inline">MOVEMENTS</span>
        </button>

        <button 
          onClick={() => setActiveTab("SALES")}
          className={`px-4 py-1.5 text-[11px] font-black rounded-lg transition-all flex items-center gap-2
          ${activeTab === "SALES" ? "bg-emerald-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"}`}
        >
          <Key className="w-3.5 h-3.5" />
          SALES <span className="hidden lg:inline">STREAM</span>
        </button>

        <button 
          onClick={() => setActiveTab("STOCK")}
          className={`px-4 py-1.5 text-[11px] font-black rounded-lg transition-all flex items-center gap-2
          ${activeTab === "STOCK" ? "bg-amber-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"}`}
        >
          <Box className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">STOCK</span> ADJUST
        </button>
      </div>

      {/* Right Aspect: Integrated Filters */}
      <div className="flex-1 flex items-center gap-3 min-w-[300px]">
        {/* Product Isolation Dropdown */}
        <div className="relative w-48 shrink-0">
          <PackageSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
          <select 
            value={selectedProduct} 
            onChange={(e) => setSelectedProduct(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-1.5 text-[11px] font-bold text-slate-300 outline-none focus:border-blue-500/50 transition-all appearance-none cursor-pointer"
          >
            <option value="ALL">Entire Catalog</option>
            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        {/* Deep Search Field */}
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-blue-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Search history, staff, or notes..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-11 pr-4 py-1.5 text-[11px] text-slate-300 placeholder-slate-600 outline-none focus:border-blue-500/50 transition-all font-mono"
          />
        </div>
      </div>
    </div>
  );
}
