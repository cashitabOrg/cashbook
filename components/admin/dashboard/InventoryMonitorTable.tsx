import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  Table,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { Maximize2 } from "lucide-react";

type Product = {
  id: string;
  name: string;
  quantity: number;
  min_quantity: number;
  unit: string;
};

type InventoryMonitorTableProps = {
  filteredInventory: Product[];
  onExpand: () => void;
};

export default function InventoryMonitorTable({
  filteredInventory,
  onExpand,
}: InventoryMonitorTableProps) {
  return (
    <Card className="flex flex-col h-[450px] p-0 overflow-hidden">
      <CardHeader className="px-3 py-3 md:px-6 md:py-4 border-b border-gray-100 dark:border-[#2C2C2E] flex flex-row justify-between items-center mb-0 bg-gray-50 dark:bg-[#252528]/50">
        <div>
          <CardTitle>Monitor stock</CardTitle>
          <span className="text-[10px] md:text-xs font-bold text-gray-500 dark:text-gray-400">
            Live Status
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="completed"
            className="hidden sm:inline-flex border-none"
          >
            Live
          </Badge>
          <button
            onClick={onExpand}
            className="p-1.5 text-gray-500 hover:text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-colors"
            title="Expand table"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </CardHeader>

      <div className="flex-1 overflow-auto p-2 md:p-4 scrollbar-hide md:custom-scrollbar">
        <Table>
          <TableHeader>
            <TableRow className="border-none hover:bg-transparent">
              <TableHead className="w-8 sm:w-12">SN</TableHead>
              <TableHead>Product</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead className="text-center">Health</TableHead>
            </TableRow>
          </TableHeader>
          <tbody>
            {filteredInventory.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="py-12 text-center text-gray-500 italic"
                >
                  No products found matching search.
                </TableCell>
              </TableRow>
            ) : (
              filteredInventory.map((p, idx) => {
                const isLow = p.quantity < p.min_quantity;
                return (
                  <TableRow key={p.id}>
                    <TableCell className="text-xs text-gray-400 font-mono">
                      {idx + 1}
                    </TableCell>
                    <TableCell className="font-semibold">{p.name}</TableCell>
                    <TableCell className="text-right">
                      <span
                        className={`font-mono font-bold ${isLow ? "text-red-500" : ""}`}
                      >
                        {p.quantity.toFixed(2)}
                      </span>
                      <span className="text-gray-500 text-[10px] ml-1 uppercase">
                        {p.unit}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      {isLow ? (
                        <Badge variant="urgent">Urgent</Badge>
                      ) : (
                        <Badge variant="completed">Healthy</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </tbody>
        </Table>
      </div>
    </Card>
  );
}
