"use client";

import { useState } from "react";
import { updateStorePlan } from "@/app/actions/super-admin";
import { toast } from "sonner";
import { CreditCard, Rocket, Star, ShieldCheck } from "lucide-react";

type StorePlanData = {
  id: string;
  name: string;
  slug: string;
  plan: string;
};

export default function SuperAdminPlansClient({
  stores,
}: {
  stores: StorePlanData[];
}) {
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleUpdatePlan = async (id: string, name: string, event: React.ChangeEvent<HTMLSelectElement>) => {
    const newPlan = event.target.value;
    
    // In a real billing integrations, this is where checkout sessions or webhooks govern state.
    // For this boilerplate, the Super Admin has manual hard override capabilities.
    const confirm = window.confirm(`Update billing plan for '${name}' to '${newPlan.toUpperCase()}'?`);
    if (!confirm) {
      // Revert select visually if cancelled
      event.target.value = stores.find(s => s.id === id)?.plan || "free";
      return;
    }
    
    setProcessingId(id);
    const res = await updateStorePlan(id, newPlan);
    if (res?.error) toast.error(res.error);
    else toast.success(`Plan for '${name}' successfully updated to ${newPlan.toUpperCase()}`);
    setProcessingId(null);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50">
        <div>
          <h3 className="text-base font-semibold leading-6 text-slate-900">Tenant Billing Allocations</h3>
          <p className="mt-1 text-sm text-slate-500">Manage subscription tiers overriding the active store capabilities.</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-white">
            <tr>
              <th scope="col" className="py-3 px-6 text-left text-xs font-medium text-slate-500 uppercase">Tenant & Workspace</th>
              <th scope="col" className="py-3 px-6 text-left text-xs font-medium text-slate-500 uppercase">Current Tier</th>
              <th scope="col" className="py-3 px-6 text-right text-xs font-medium text-slate-500 uppercase">Manage Allowance</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-100">
            {stores.length === 0 ? (
              <tr>
                <td colSpan={3} className="py-12 text-center text-sm text-slate-500">
                  <CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  No stores provisioned yet.
                </td>
              </tr>
            ) : (
              stores.map((store) => (
                <tr key={store.id} className="hover:bg-slate-50/50">
                  <td className="py-4 px-6 whitespace-nowrap text-sm text-slate-900">
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-800">{store.name}</span>
                      <span className="text-xs text-slate-500 font-mono">{store.slug}.frozenpos.com</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 whitespace-nowrap text-sm text-slate-600">
                    {store.plan === 'pro' ? (
                       <span className="px-2.5 py-1 rounded-md bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-800 text-xs font-bold border border-indigo-200 flex items-center gap-1.5 w-fit shadow-inner">
                         <Star className="w-3.5 h-3.5 text-indigo-600 fill-indigo-600" /> PRO PLAN
                       </span>
                    ) : store.plan === 'basic' ? (
                       <span className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200 flex items-center gap-1.5 w-fit shadow-sm">
                         <Rocket className="w-3.5 h-3.5 text-blue-500" /> STANDARD
                       </span>
                    ) : (
                       <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200 flex items-center gap-1.5 w-fit">
                         <ShieldCheck className="w-3.5 h-3.5 text-slate-400" /> FREE
                       </span>
                    )}
                  </td>
                  <td className="py-4 px-6 whitespace-nowrap text-right text-sm font-medium">
                     <select
                      disabled={processingId === store.id}
                      defaultValue={store.plan}
                      onChange={(e) => handleUpdatePlan(store.id, store.name, e)}
                      className="block w-40 ml-auto appearance-none text-right font-semibold uppercase tracking-wider text-xs rounded-md border-0 py-2 pl-3 pr-8 text-slate-700 ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-emerald-600 hover:bg-slate-50 disabled:opacity-50 transition-colors cursor-pointer"
                    >
                      <option value="free">Free Tier</option>
                      <option value="basic">Standard</option>
                      <option value="pro">Pro Plan</option>
                    </select>
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
