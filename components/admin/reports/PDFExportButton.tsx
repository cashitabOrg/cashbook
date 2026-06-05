"use client";

import { PDFDownloadLink } from "@react-pdf/renderer";
import SalesReportPDF from "../SalesReportPDF";
import { Download } from "lucide-react";

type PerformanceRecord = {
  name: string;
  qty: number;
  revenue: number;
};

type SaleRecord = {
  id: string;
  dateStr: string;
  managerName: string;
  productName: string;
  qty: number;
  price: number;
  revenue: number;
  cost: number;
  profit: number;
};

type Props = {
  storeName: string;
  startDate: string;
  endDate: string;
  filteredSales: SaleRecord[];
  totalSalesQty: number;
  totalSalesRevenue: number;
  totalSalesProfit: number;
  performanceArray: PerformanceRecord[];
  onDownloaded: () => void;
};

export default function PDFExportButton({
  storeName,
  startDate,
  endDate,
  filteredSales,
  totalSalesQty,
  totalSalesRevenue,
  totalSalesProfit,
  performanceArray,
  onDownloaded,
}: Props) {
  return (
    <PDFDownloadLink
      document={
        <SalesReportPDF
          storeName={storeName}
          period={`${startDate} to ${endDate}`}
          data={filteredSales}
          totalQty={totalSalesQty}
          totalRevenue={totalSalesRevenue}
          totalProfit={totalSalesProfit}
          performanceSummary={performanceArray}
        />
      }
      fileName={`sales-report.pdf`}
      className="bg-emerald-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md active:scale-95 animate-pulse"
      onClick={() => setTimeout(onDownloaded, 2000)}
    >
      {/* @ts-ignore */}
      {({ loading }) =>
        loading ? "GENERATING..." : <><Download className="w-3 h-3" /> READY! DOWNLOAD</>
      }
    </PDFDownloadLink>
  );
}
