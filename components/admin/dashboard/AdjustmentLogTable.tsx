import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  Table,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { format } from "date-fns";

type AdjustmentLogTableProps = {
  recentAdjustments?: any[];
};

export default function AdjustmentLogTable({
  recentAdjustments,
}: AdjustmentLogTableProps) {
  return (
    <Card className="flex flex-col p-0 overflow-hidden">
      <CardHeader className="px-6 py-4 border-b border-gray-100 dark:border-[#2C2C2E] flex flex-row justify-between items-center mb-0 bg-gray-50 dark:bg-[#252528]/50">
        <div>
          <CardTitle>Stock Adjustment Log</CardTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Most recent inventory corrections and spoilage logs.
          </p>
        </div>
      </CardHeader>

      <div className="overflow-x-auto p-4">
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
                  <TableCell className="text-xs text-gray-500">
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
    </Card>
  );
}
