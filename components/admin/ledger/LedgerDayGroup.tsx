"use client";

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
        className="w-full bg-gray-50 dark:bg-[#252528] hover:bg-gray-100 dark:hover:bg-[#3A3A3C] border border-gray-200 dark:border-[#3A3A3C] px-4 py-3 flex items-center justify-between transition-colors outline-none cursor-pointer rounded-lg shadow-sm"
      >
        <div className="flex items-center gap-3">
          {isOpen ? <ChevronDown className="w-5 h-5 text-blue-600 dark:text-blue-500" /> : <ChevronRight className="w-5 h-5 text-gray-500 dark:text-gray-400" />}
          <CalendarDays className={`w-5 h-5 ${isOpen ? 'text-blue-600 dark:text-blue-500' : 'text-gray-500 dark:text-gray-400'}`} />
          <span className={`text-sm tracking-wide ${isOpen ? 'font-bold text-blue-900 dark:text-blue-100' : 'font-semibold text-gray-600 dark:text-gray-400'}`}>
            {group.dateLabel}
          </span>
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400 font-mono bg-white dark:bg-[#1C1C1E] px-2 py-1 rounded-md border border-gray-200 dark:border-[#3A3A3C] flex items-center justify-center">
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
