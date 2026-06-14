"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  Table,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { format } from "date-fns";
import { ChevronDown, ChevronUp } from "lucide-react";

export type Adjustment = {
  id: string | number;
  created_at: string;
  quantity_change: number;
  reason: string;
  note?: string | null;
  products?: { name: string } | null;
  users?: { full_name: string } | null;
};

type AdjustmentLogTableProps = {
  recentAdjustments?: Adjustment[];
};

export default function AdjustmentLogTable({
  recentAdjustments,
}: AdjustmentLogTableProps) {
  const [expandedId, setExpandedId] = useState<string | number | null>(null);

  const toggleExpand = (id: string | number) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <Card className="flex flex-col p-0 overflow-hidden">
      <CardHeader className="px-3 py-3 md:px-6 md:py-4 border-b border-gray-100 dark:border-[#2C2C2E] flex flex-row justify-between items-center mb-0 bg-gray-50 dark:bg-[#252528]/50">
        <div>
          <CardTitle>Stock Adjustment Log</CardTitle>
          <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
            Most recent inventory corrections and spoilage logs.
          </p>
        </div>
      </CardHeader>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto p-2 md:p-4">
        <Table>
          <TableHeader>
            <TableRow className="border-none hover:bg-transparent">
              <TableHead className="w-12">SN</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Product</TableHead>
              <TableHead className="text-right">Adjustment</TableHead>
              <TableHead className="pl-6">Reason</TableHead>
              <TableHead className="pl-6">Admin</TableHead>
              <TableHead className="pr-6">Notes</TableHead>
            </TableRow>
          </TableHeader>
          <tbody>
            {!recentAdjustments || recentAdjustments.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-12 text-center text-gray-500 italic"
                >
                  No recent adjustments found.
                </TableCell>
              </TableRow>
            ) : (
              recentAdjustments.map((adj, idx) => (
                <TableRow key={adj.id}>
                  <TableCell className="text-[10px] text-gray-400 font-mono italic">
                    {idx + 1}
                  </TableCell>
                  <TableCell className="text-xs text-gray-500" suppressHydrationWarning>
                    {format(new Date(adj.created_at), "MMM d, HH:mm")}
                  </TableCell>
                  <TableCell className="font-semibold">
                    {adj.products?.name}
                  </TableCell>
                  <TableCell
                    className={`font-black text-right ${adj.quantity_change < 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}
                  >
                    {adj.quantity_change < 0 ? "-" : "+"}
                    {Math.abs(adj.quantity_change).toFixed(2)}
                  </TableCell>
                  <TableCell className="pl-6">
                    <span className="bg-gray-100 dark:bg-[#252528] text-gray-600 dark:text-gray-300 px-2.5 py-1 rounded-md uppercase tracking-tighter border border-gray-200 dark:border-[#2C2C2E] shadow-sm text-xs font-bold">
                      {adj.reason}
                    </span>
                  </TableCell>
                  <TableCell className="pl-6 font-medium text-gray-600 dark:text-gray-300">
                    {adj.users?.full_name || "Admin"}
                  </TableCell>
                  <TableCell className="text-[11px] text-gray-500 italic pr-6 truncate max-w-[200px]">
                    {adj.note || "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </tbody>
        </Table>
      </div>

      {/* Mobile Cards View */}
      <div className="md:hidden flex flex-col p-2 gap-2">
        {!recentAdjustments || recentAdjustments.length === 0 ? (
          <div className="py-12 text-center text-gray-500 italic border rounded-lg border-gray-100 dark:border-[#2C2C2E]">
            No recent adjustments found.
          </div>
        ) : (
          recentAdjustments.map((adj, idx) => {
            const isExpanded = expandedId === adj.id;
            return (
              <div
                key={adj.id}
                className="flex flex-col border border-gray-100 dark:border-[#2C2C2E] rounded-lg overflow-hidden bg-white dark:bg-[#1E1E20] shadow-sm transition-all"
              >
                {/* Card Header (Always Visible) */}
                <div
                  onClick={() => toggleExpand(adj.id)}
                  className="flex items-center justify-between p-2.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-[#252528]/50"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-gray-400 font-mono italic">
                      #{idx + 1}
                    </span>
                    <span className="font-semibold text-sm">
                      {adj.products?.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-black ${adj.quantity_change < 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}
                    >
                      {adj.quantity_change < 0 ? "-" : "+"}
                      {Math.abs(adj.quantity_change).toFixed(2)}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Card Body (Expanded Details) */}
                {isExpanded && (
                  <div className="px-2.5 py-2 border-t border-gray-100 dark:border-[#2C2C2E] bg-gray-50 dark:bg-[#252528]/30 space-y-1.5">
                    {/* Row 1: Time, Reason, Staff justified to fill the card width */}
                    <div className="flex items-center justify-between w-full text-xs gap-2">
                      <span className="text-gray-600 dark:text-gray-300 whitespace-nowrap">
                        <span className="font-bold text-gray-900 dark:text-gray-100">Time:</span>{" "}
                        <span className="font-mono text-gray-700 dark:text-gray-300" suppressHydrationWarning>{format(new Date(adj.created_at), "MMM d, HH:mm")}</span>
                      </span>
                      <span className="text-gray-600 dark:text-gray-300 whitespace-nowrap">
                        <span className="font-bold text-gray-900 dark:text-gray-100">Reason:</span>{" "}
                        <span className="bg-gray-200 dark:bg-[#353538] text-gray-700 dark:text-gray-200 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold">
                          {adj.reason}
                        </span>
                      </span>
                      <span className="text-gray-600 dark:text-gray-300 whitespace-nowrap text-right">
                        <span className="font-bold text-gray-900 dark:text-gray-100">Staff:</span>{" "}
                        <span className="text-gray-700 dark:text-gray-300">{adj.users?.full_name || "Admin"}</span>
                      </span>
                    </div>
                    {/* Row 2: Note */}
                    <div className="text-xs text-gray-600 dark:text-gray-300">
                      <span className="font-bold text-gray-900 dark:text-gray-100">Note:</span>{" "}
                      <span className="italic text-gray-600 dark:text-gray-400">{adj.note || "No notes provided."}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}
