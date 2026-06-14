"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { format, subDays, subMonths, subYears, parseISO } from "date-fns";
import { toLagosDateString } from "@/lib/date-utils";
import { approveDailySales, approveSession } from "@/app/actions/sales";
import { createClient } from "@/lib/supabase";
import { toast } from "sonner";
import DailySalesRow from "./DailySalesRow";
import ReportsHeader from "./reports/ReportsHeader";
import { getPlanLimits } from "@/lib/plans";

type SessionGroup = {
  id: string;
  managerName: string;
  approvalStatus: string;
  revenue: number;
  expectedRevenue: number;
  qty: number;
  startedAt: string;
};

type SaleRecord = {
  id: string;
  dateStr: string;
  timestamp: string;
  managerName: string;
  productName: string;
  qty: number;
  price: number;
  revenue: number;
  cost: number;
  profit: number;
  sessionId?: string;
  approvalStatus?: string;
  isDeleted?: boolean;
};

type StockInRecord = {
  id: string;
  dateStr: string;
  timestamp: string;
  productName: string;
  qtyAdded: number;
  unitCost: number;
  totalCost: number;
  addedBy: string;
  note: string | null;
};

type StockAdjustmentRecord = {
  id: string;
  dateStr: string;
  timestamp: string;
  productName: string;
  qtyChange: number;
  reason: string;
  adjustedBy: string;
  note: string | null;
};


export default function ReportsClient({
  storeId,
  storeName,
  plan,
  isBillingExempt,
  salesData,
}: {
  storeId: string;
  storeName: string;
  plan: string;
  isBillingExempt: boolean;
  salesData: SaleRecord[];
}) {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [sales, setSales] = useState<SaleRecord[]>(salesData);
  const [approvingDate, setApprovingDate] = useState<string | null>(null);
  const [isPreparingExport, setIsPreparingExport] = useState(false);
  
  // Normalize plan and calculate export capability
  let activePlan = plan.toLowerCase();
  if (activePlan === 'basic') activePlan = 'growth';
  if (activePlan === 'pro') activePlan = 'business';
  const limits = getPlanLimits(activePlan);
  const canExportReports = limits.features.exportReports || isBillingExempt;
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Sync prop changes (e.g. after router.refresh()) back into state
  useEffect(() => {
    setSales(salesData);
  }, [salesData]);

  // Real-time subscription on sale_items and sales_sessions — updates report instantly
  useEffect(() => {
    if (!storeId) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`reports-realtime-${storeId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'sale_items',
        filter: `store_id=eq.${storeId}`,
      }, () => {
        console.log("[ReportsClient] Realtime change on sale_items, refreshing server data...");
        router.refresh();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'sales_sessions',
        filter: `store_id=eq.${storeId}`,
      }, () => {
        console.log("[ReportsClient] Realtime change on sales_sessions, refreshing server data...");
        router.refresh();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [storeId, router]);

  // Polling fallback to keep reports up-to-date if realtime connection drops
  useEffect(() => {
    const interval = setInterval(() => {
      console.log("[ReportsClient] Polling reports data update...");
      router.refresh();
    }, 10000); // Poll every 10 seconds

    return () => {
      clearInterval(interval);
    };
  }, [router]);
  
  // Robust Filtering State - Default to Last 7 Days in Lagos Timezone
  const [startDate, setStartDate] = useState(() => {
    const todayLagos = new Date(new Intl.DateTimeFormat('en-US', { timeZone: 'Africa/Lagos' }).format(new Date()));
    return format(subDays(todayLagos, 7), "yyyy-MM-dd");
  });
  const [endDate, setEndDate] = useState(() => toLagosDateString(new Date()));
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});

  const applyPreset = (range: string) => {
    const todayLagos = new Date(new Intl.DateTimeFormat('en-US', { timeZone: 'Africa/Lagos' }).format(new Date()));
    const todayStr = toLagosDateString(new Date());
    setEndDate(todayStr);
    
    switch (range) {
      case "today":
        setStartDate(todayStr);
        break;
      case "yesterday":
        const yesterday = subDays(todayLagos, 1);
        const yesterdayStr = toLagosDateString(yesterday);
        setStartDate(yesterdayStr);
        setEndDate(yesterdayStr);
        break;
      case "7d":
        setStartDate(toLagosDateString(subDays(todayLagos, 7)));
        break;
      case "1m":
        setStartDate(toLagosDateString(subMonths(todayLagos, 1)));
        break;
      case "3m":
        setStartDate(toLagosDateString(subMonths(todayLagos, 3)));
        break;
      case "6m":
        setStartDate(toLagosDateString(subMonths(todayLagos, 6)));
        break;
      case "1y":
        setStartDate(toLagosDateString(subYears(todayLagos, 1)));
        break;
    }
  };

  const filterItem = (item: any, dateField: string, searchFields: string[]) => {
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      if (new Date(item[dateField]) < start) return false;
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      if (new Date(item[dateField]) > end) return false;
    }
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      const matches = searchFields.some(field => 
        String(item[field] || "").toLowerCase().includes(lowerQuery)
      );
      if (!matches) return false;
    }
    return true;
  };

  const filteredSales = useMemo(() => 
    sales.filter((item) => filterItem(item, "timestamp", ["productName", "managerName"]))
  , [sales, startDate, endDate, searchQuery]);

  // Grouping Logic
  const groupedSales = useMemo(() => {
    const groups: Record<string, { 
      items: SaleRecord[], 
      revenue: number, 
      expectedRevenue: number,
      qty: number, 
      isFullyApproved: boolean,
      sessions: Record<string, SessionGroup>
    }> = {};
    
    filteredSales.forEach(s => {
      const dayKey = toLagosDateString(s.timestamp);
      if (!groups[dayKey]) {
        groups[dayKey] = { 
          items: [], 
          revenue: 0, 
          expectedRevenue: 0, 
          qty: 0, 
          isFullyApproved: true,
          sessions: {}
        };
      }
      groups[dayKey].items.push(s);
      
      // Only contribute to totals if NOT deleted
      if (!s.isDeleted) {
        groups[dayKey].revenue += s.revenue;
        groups[dayKey].expectedRevenue += s.qty * s.price;
        groups[dayKey].qty += s.qty;
      }

      if (s.approvalStatus !== 'approved' && !s.isDeleted) {
        groups[dayKey].isFullyApproved = false;
      }

      if (s.sessionId) {
        if (!groups[dayKey].sessions[s.sessionId]) {
          groups[dayKey].sessions[s.sessionId] = {
            id: s.sessionId,
            managerName: s.managerName,
            approvalStatus: s.approvalStatus || 'pending',
            revenue: 0,
            expectedRevenue: 0,
            qty: 0,
            startedAt: s.timestamp
          };
        }
        const sess = groups[dayKey].sessions[s.sessionId];
        if (!s.isDeleted) {
          sess.revenue += s.revenue;
          sess.expectedRevenue += s.qty * s.price;
          sess.qty += s.qty;
        }
        if (new Date(s.timestamp) < new Date(sess.startedAt)) {
          sess.startedAt = s.timestamp;
        }
      }
    });

    // Sort Descending (Newest first)
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filteredSales]);

  // Auto-expand latest date when data changes
  useEffect(() => {
    if (groupedSales.length > 0) {
      setExpandedDates({ [groupedSales[0][0]]: true });
    }
  }, [groupedSales.length]);

  const [approvingSessionId, setApprovingSessionId] = useState<string | null>(null);

  const handleApproveDay = useCallback(async (dateStr: string) => {
    setApprovingDate(dateStr);
    const reason = window.prompt(`Approve all sales for ${dateStr}? This locks the data permanently. Note (optional):`);
    if (reason === null) {
      setApprovingDate(null);
      return;
    }
    
    const res = await approveDailySales(dateStr, storeId, reason);
    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success(`Approved all sales for ${dateStr}!`);
    }
    setApprovingDate(null);
  }, [storeId]);

  const handleApproveSession = useCallback(async (sessionId: string, dateStr: string) => {
    setApprovingSessionId(sessionId);
    const reason = window.prompt(`Approve this sales session? This locks the session's records permanently. Note (optional):`);
    if (reason === null) {
      setApprovingSessionId(null);
      return;
    }
    
    const res = await approveSession(sessionId, reason);
    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success(`Approved session successfully!`);
    }
    setApprovingSessionId(null);
  }, []);

  const toggleExpanded = useCallback((key: string) => {
    setExpandedDates(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  }, []);


  const totalSalesRevenue = useMemo(() => filteredSales.reduce((sum, item) => sum + item.revenue, 0), [filteredSales]);
  const totalSalesProfit = useMemo(() => filteredSales.reduce((sum, item) => sum + item.profit, 0), [filteredSales]);
  const totalSalesQty = useMemo(() => filteredSales.reduce((sum, item) => sum + item.qty, 0), [filteredSales]);
  
  const performanceArray = useMemo(() => {
    const map: Record<string, { qty: number, revenue: number }> = {};
    filteredSales.forEach(sale => {
      if (!map[sale.productName]) map[sale.productName] = { qty: 0, revenue: 0 };
      map[sale.productName].qty += sale.qty;
      map[sale.productName].revenue += sale.revenue;
    });
    return Object.entries(map).map(([name, stats]) => ({ name, ...stats })).sort((a, b) => b.revenue - a.revenue);
  }, [filteredSales]);

  return (
    <div className="flex flex-col gap-4 h-[calc(100dvh-56px)] md:h-full min-h-[500px]">
      <ReportsHeader 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        applyPreset={applyPreset}
        isClient={isClient}
        isPreparingExport={isPreparingExport}
        setIsPreparingExport={setIsPreparingExport}
        storeName={storeName}
        filteredSales={filteredSales}
        totalSalesQty={totalSalesQty}
        totalSalesRevenue={totalSalesRevenue}
        totalSalesProfit={totalSalesProfit}
        performanceArray={performanceArray}
        canExportReports={canExportReports}
      />

      <div className="flex-1 overflow-auto bg-white dark:bg-[#1C1C1E] lg:rounded-xl lg:shadow-sm lg:border border-gray-200 dark:border-[#2C2C2E] transition-colors">
        {groupedSales.length === 0 ? (
          <div className="py-20 text-center text-gray-500 dark:text-gray-400 italic font-medium">No sales found for this period.</div>
        ) : (
          groupedSales.map(([date, data]) => (
            <DailySalesRow 
              key={date}
              dateStr={date}
              data={data as any}
              plan={plan}
              isExempt={isBillingExempt}
              storeId={storeId}
              approvingDate={approvingDate}
              onApprove={handleApproveDay}
              approvingSessionId={approvingSessionId}
              onApproveSession={handleApproveSession}
              isExpanded={!!expandedDates[date]}
              onToggle={toggleExpanded}
            />
          ))
        )}
      </div>
    </div>
  );
}

