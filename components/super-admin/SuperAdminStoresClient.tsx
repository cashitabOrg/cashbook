"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { toggleStoreStatus, deleteStoreHard } from "@/app/actions/super-admin";
import { toast } from "sonner";
import { Store, Building2, Ban, Trash2, CheckCircle2, ShieldCheck } from "lucide-react";
import Link from "next/link";

type StoreData = {
  id: string;
  name: string;
  slug: string;
  plan: string;
  is_active: boolean;
  is_billing_exempt: boolean;
  created_at: string;
  ownerName: string;
  ownerUsername: string;
};

export default function SuperAdminStoresClient({
  stores,
}: {
  stores: StoreData[];
}) {
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleToggle = async (id: string, name: string, currentStatus: boolean) => {
    setProcessingId(id);
    const targetStatus = !currentStatus;
    const res = await toggleStoreStatus(id, targetStatus);
    if (res?.error) toast.error(res.error);
    else toast.success(`Store '${name}' is now ${targetStatus ? 'Active' : 'Suspended'}`);
    setProcessingId(null);
  };

  const handleDelete = async (id: string, name: string) => {
    const confirmName = prompt(`DANGER: To delete '${name}', type its exact name below. This deletes ALL associated users, products, and sales permanently.`);
    if (confirmName !== name) {
      if (confirmName !== null) toast.error("Name did not match. Deletion aborted.");
      return;
    }
    
    setProcessingId(id);
    const res = await deleteStoreHard(id);
    if (res?.error) toast.error(res.error);
    else toast.success(`Store '${name}' and all associated data permanently deleted.`);
    setProcessingId(null);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold leading-6 text-slate-900">Registered Tenancies (Stores)</h3>
          <p className="mt-1 text-sm text-slate-500">All tenants hosted on this deployment.</p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th scope="col" className="py-3 px-6 text-left text-xs font-medium text-slate-500 uppercase">Tenant Name</th>
              <th scope="col" className="py-3 px-6 text-left text-xs font-medium text-slate-500 uppercase">System Slug</th>
              <th scope="col" className="py-3 px-6 text-left text-xs font-medium text-slate-500 uppercase">Owner</th>
              <th scope="col" className="py-3 px-6 text-left text-xs font-medium text-slate-500 uppercase">Plan</th>
              <th scope="col" className="py-3 px-6 text-center text-xs font-medium text-slate-500 uppercase">Status</th>
              <th scope="col" className="py-3 px-6 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-100">
            {stores.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-sm text-slate-500">
                  <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  No stores registered yet.
                </td>
              </tr>
            ) : (
              stores.map((store) => (
                <tr key={store.id} className="hover:bg-slate-50">
                  <td className="py-4 px-6 whitespace-nowrap text-sm font-medium text-slate-900 flex items-center gap-2">
                    <Store className="w-4 h-4 text-blue-500" />
                    {store.name}
                  </td>
                  <td className="py-4 px-6 whitespace-nowrap text-sm font-mono text-slate-600">{store.slug}</td>
                  <td className="py-4 px-6 whitespace-nowrap text-sm text-slate-600">
                    <div className="flex flex-col">
                      <span>{store.ownerName}</span>
                      <span className="text-xs text-slate-400">@{store.ownerUsername}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 whitespace-nowrap text-sm text-slate-600">
                    <div className="flex flex-col gap-1">
                      <span className="capitalize px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-[10px] font-bold w-fit">
                        {store.plan}
                      </span>
                      {store.is_billing_exempt && (
                         <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-tighter text-amber-600 italic">
                            <ShieldCheck className="w-3 h-3" /> Whitelisted
                         </span>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-6 whitespace-nowrap text-center">
                    {store.is_active ? (
                      <span className="inline-flex items-center gap-1.5 rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                        <CheckCircle2 className="w-3 h-3" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10">
                        <Ban className="w-3 h-3" /> Suspended
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-6 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/super-admin/stores/${store.slug}`}
                        className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded transition-colors text-xs font-semibold"
                      >
                        Inspect
                      </Link>
                      
                      <button
                        onClick={() => handleToggle(store.id, store.name, store.is_active)}
                        disabled={processingId === store.id}
                        className="text-orange-600 hover:text-orange-900 bg-orange-50 hover:bg-orange-100 p-1.5 rounded transition-colors disabled:opacity-50"
                        title={store.is_active ? "Suspend Store" : "Reactivate Store"}
                      >
                        {store.is_active ? <Ban className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                      </button>

                      <button
                        onClick={() => handleDelete(store.id, store.name)}
                        disabled={processingId === store.id}
                        className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 p-1.5 rounded transition-colors disabled:opacity-50"
                        title="Delete Permanently"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
