"use client";

import { useState } from "react";
import { wipeTenantData, exportTenantData } from "@/app/actions/tenant-data";
import { Trash2, DownloadCloud, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export default function DangerZoneClient({ storeId }: { storeId: string }) {
  const [isWiping, setIsWiping] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleWipe = async () => {
    const code = Math.floor(1000 + Math.random() * 9000);
    const confirm = window.prompt(`DANGER: This will delete ALL products and sales data for this store.\n\nType ${code} to confirm.`);
    if (confirm !== code.toString()) {
      toast.error("Wipe cancelled");
      return;
    }

    setIsWiping(true);
    const res = await wipeTenantData(storeId);
    setIsWiping(false);

    if (res.error) toast.error(res.error);
    else toast.success("Tenant data wiped successfully.");
  };

  const handleExport = async () => {
    setIsExporting(true);
    const res = await exportTenantData(storeId);
    setIsExporting(false);

    if (res.error) {
      toast.error(res.error);
    } else if (res.data) {
      const blob = new Blob([res.data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tenant_export_${storeId}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Download started");
    }
  };

  return (
    <div className="bg-red-50 rounded-xl border border-red-200 shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-red-200 bg-red-100 flex items-center gap-2">
         <AlertTriangle className="w-5 h-5 text-red-600" />
         <h3 className="text-base font-semibold leading-6 text-red-900">Danger Zone</h3>
      </div>
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-white">
        <div className="space-y-3">
          <h4 className="font-semibold text-slate-900">Export Tenant Data</h4>
          <p className="text-sm text-slate-500">Download a full JSON dump of all products, sessions, and users for compliance or portability.</p>
          <button 
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-4 py-2 rounded transition-colors disabled:opacity-50"
          >
            <DownloadCloud className="w-4 h-4" /> {isExporting ? "Compiling..." : "Export to JSON"}
          </button>
        </div>

        <div className="space-y-3">
          <h4 className="font-semibold text-slate-900">Wipe Data/State</h4>
          <p className="text-sm text-slate-500">Destructively scrub all transactional and catalog data from this tenant while keeping the store provisioning intact.</p>
          <button 
            onClick={handleWipe}
            disabled={isWiping}
            className="flex items-center gap-2 text-sm bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" /> {isWiping ? "Erasing..." : "Execute Wipe"}
          </button>
        </div>
      </div>
    </div>
  );
}
