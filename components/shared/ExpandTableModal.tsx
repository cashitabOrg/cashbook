"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

interface ExpandTableModalProps {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export default function ExpandTableModal({
  title,
  subtitle,
  icon,
  isOpen,
  onClose,
  children,
}: ExpandTableModalProps) {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-[#2C2C2E] rounded-2xl shadow-2xl w-full max-w-5xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-[#2C2C2E] flex items-center justify-between shrink-0 bg-gray-50/80 dark:bg-[#252528]/80 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="bg-gray-100 dark:bg-[#2C2C2E] p-2 rounded-lg text-slate-600 dark:text-gray-400">
              {icon}
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight leading-none">{title}</h2>
              {subtitle && <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5 font-light">{subtitle}</p>}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#252528] rounded-xl transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Table Body */}
        <div className="overflow-auto flex-1 rounded-b-2xl bg-white dark:bg-[#1C1C1E]">
          {children}
        </div>
      </div>
    </div>
  );
}
