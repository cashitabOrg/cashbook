import { ChevronDown, ChevronRight, CalendarDays } from "lucide-react";
import LedgerTransactionRow from "./LedgerTransactionRow";

type LedgerDayGroupProps = {
  group: { dateLabel: string, items: any[] };
  isOpen: boolean;
  onToggle: (dateLabel: string) => void;
};

export default function LedgerDayGroup({ group, isOpen, onToggle }: LedgerDayGroupProps) {
  return (
    <div className="animate-in fade-in duration-500 mb-1">
      {/* 📅 COLLAPSIBLE SEPARATOR */}
      <button 
        onClick={() => onToggle(group.dateLabel)}
        className="w-full bg-slate-950/60 hover:bg-slate-950 border border-slate-800/80 px-4 py-3 flex items-center justify-between transition-colors outline-none cursor-pointer rounded-lg shadow-sm"
      >
        <div className="flex items-center gap-3">
          {isOpen ? <ChevronDown className="w-5 h-5 text-blue-500" /> : <ChevronRight className="w-5 h-5 text-slate-500" />}
          <CalendarDays className={`w-5 h-5 ${isOpen ? 'text-blue-500' : 'text-slate-500'}`} />
          <span className={`text-sm tracking-wide ${isOpen ? 'font-bold text-blue-100' : 'font-semibold text-slate-400'}`}>
            {group.dateLabel}
          </span>
        </div>
        <span className="text-xs text-slate-500 font-mono bg-slate-900 px-2 py-1 rounded-md border border-slate-800/50 flex items-center justify-center">
          {group.items.length} Entries
        </span>
      </button>

      {/* Individual Transactions */}
      {isOpen && group.items.map((tx, idx) => (
        <LedgerTransactionRow key={tx.id} tx={tx} idx={idx} />
      ))}
    </div>
  );
}
