import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  Table,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { Maximize2, TrendingUp } from "lucide-react";

type PerformanceTableProps = {
  topProducts: {
    id: string;
    name: string;
    total_qty_sold: number;
    total_revenue: number;
  }[];
  onExpand: () => void;
};

export default function PerformanceTable({
  topProducts,
  onExpand,
}: PerformanceTableProps) {
  return (
    <Card className="flex flex-col h-[450px] p-0 overflow-hidden">
      <CardHeader className="px-6 py-4 border-b border-gray-100 dark:border-[#2C2C2E] flex flex-row justify-between items-center mb-0 bg-gray-50 dark:bg-[#252528]/50">
        <div>
          <CardTitle>My Sales</CardTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Sales breakdown for selected range.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-500" />
          <button
            onClick={onExpand}
            className="p-1.5 text-gray-500 hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors"
            title="Expand table"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </CardHeader>

      <div className="flex-1 overflow-auto p-4">
        <Table>
          <TableHeader>
            <TableRow className="border-none hover:bg-transparent">
              <TableHead className="w-12">SN</TableHead>
              <TableHead>Product Name</TableHead>
              <TableHead className="text-right">Units Sold</TableHead>
              <TableHead className="text-right">Revenue</TableHead>
            </TableRow>
          </TableHeader>
          <tbody>
            {topProducts.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="py-12 text-center text-gray-500 italic"
                >
                  No sales found matching search/dates.
                </TableCell>
              </TableRow>
            ) : (
              topProducts.map((p, idx) => (
                <TableRow key={p.id}>
                  <TableCell className="text-xs text-gray-400 font-mono">
                    {idx + 1}
                  </TableCell>
                  <TableCell className="font-semibold">{p.name}</TableCell>
                  <TableCell className="text-right font-mono">
                    {p.total_qty_sold.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-emerald-500">
                    ₦{Number(p.total_revenue).toFixed(2)}
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
