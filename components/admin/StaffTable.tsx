"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import StaffModal from "./StaffModal";
import { deleteManager, toggleManagerStatus } from "@/app/actions/staff";
import { toast } from "sonner";
import { UserPlus, Edit, Trash2, ShieldBan, ShieldCheck, UsersRound, Zap } from "lucide-react";
import { getPlanLimits } from "@/lib/plans";

type Staff = {
  id: string;
  full_name: string;
  username: string;
  is_active: boolean;
  created_at: string;
};

export default function StaffTable({
  storeSlug,
  staffList,
  plan,
  isExempt,
  totalUserCount
}: {
  storeSlug: string;
  staffList: Staff[];
  plan: string;
  isExempt?: boolean;
  totalUserCount: number;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [activeStaff, setActiveStaff] = useState<Staff | null>(null);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const limits = getPlanLimits(plan);
  const usagePercentage = Math.min(100, (totalUserCount / limits.maxStaff) * 100);
  const isNearLimit = usagePercentage >= 80;
  const isLimitReached = totalUserCount >= limits.maxStaff;

  const handleEdit = (staff: Staff) => {
    setActiveStaff(staff);
    setModalOpen(true);
  };

  const handleAddNew = () => {
    setActiveStaff(null);
    setModalOpen(true);
  };

  const handleToggleStatus = async (id: string, name: string, targetStatus: boolean) => {
    setIsProcessing(id);
    startTransition(async () => {
      const res = await toggleManagerStatus(storeSlug, id, targetStatus);
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success(`${name} is now ${targetStatus ? 'Active' : 'Deactivated'}`);
        router.refresh();
      }
      setIsProcessing(null);
    });
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete manager ${name}? This action cannot be undone.`)) {
      return;
    }
    
    setIsProcessing(id);
    startTransition(async () => {
      const res = await deleteManager(storeSlug, id);
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success("Manager deleted successfully");
        router.refresh();
      }
      setIsProcessing(null);
    });
  };

  return (
    <>
      <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 lg:px-6 py-4 flex items-center justify-between mb-2 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-500/20">
            <UsersRound className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm lg:text-xl font-black text-white tracking-tight leading-none">Team</h1>
            <p className="text-[8px] lg:text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Staff Management</p>
          </div>
        </div>

        <div className="flex items-center gap-4 px-4 bg-slate-800/50 py-1.5 rounded-xl border border-slate-700/50">
           <div className="flex flex-col gap-1 w-24 sm:w-32">
              <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-tighter text-slate-400">
                <span>Usage</span>
                <span>{totalUserCount} / {limits.maxStaff === 1000000 ? '∞' : limits.maxStaff}</span>
              </div>
              <div className="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ${isNearLimit ? 'bg-red-500' : 'bg-blue-600'}`} 
                  style={{ width: `${usagePercentage}%` }} 
                />
              </div>
           </div>

           {plan === 'free' && !isExempt && (
             <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 bg-amber-50 rounded-lg border border-amber-100 animate-pulse">
                <Zap className="w-3 h-3 text-amber-600 fill-amber-600" />
                <span className="text-[8px] font-black text-amber-700 uppercase tracking-widest">Upgrade</span>
             </div>
           )}
        </div>
        
        <button
          type="button"
          onClick={handleAddNew}
          disabled={isLimitReached}
          className={`relative z-10 inline-flex items-center rounded-xl px-3 py-2 lg:px-4 lg:py-2 text-[10px] font-black text-white shadow-lg transition-all active:scale-95 gap-2 uppercase tracking-widest ${
            isLimitReached 
              ? "bg-slate-400 cursor-not-allowed grayscale" 
              : "bg-slate-900 hover:bg-slate-800"
          }`}
        >
          {isLimitReached ? <ShieldBan className="h-3.5 w-3.5 lg:h-4 lg:w-4" /> : <UserPlus className="h-3.5 w-3.5 lg:h-4 lg:w-4" />}
          <span className="hidden sm:inline">{isLimitReached ? "Limit Reached" : "Add Manager"}</span>
          <span className="sm:hidden">{isLimitReached ? "Full" : "Add"}</span>
        </button>
      </div>

      <div className="px-2 lg:px-0 mt-6 lg:mt-8">
        {/* Mobile View: High-Density Cards */}
        <div className="lg:hidden space-y-4">
          {staffList.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center shadow-2xl">
              <UsersRound className="mx-auto h-12 w-12 text-slate-700 mb-3" />
              <h3 className="text-sm font-medium text-slate-300">No managers found</h3>
              <p className="mt-1 text-sm text-slate-500">Add a manager so they can start processing sales.</p>
            </div>
          ) : (
            staffList.map((staff) => (
              <div key={staff.id} className="bg-slate-800 p-4 rounded-2xl border border-slate-700 shadow-2xl relative group overflow-hidden transition-all active:ring-2 active:ring-blue-500/20">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
                
                <div className="flex justify-between items-start mb-4 relative z-10">
                  <div className="flex-1 min-w-0 pr-2">
                    <h3 className="text-base font-bold text-white truncate tracking-tight">{staff.full_name}</h3>
                    <p className="text-[11px] font-mono text-slate-400 mt-0.5">@{staff.username}</p>
                  </div>
                  
                  {staff.is_active ? (
                    <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700 uppercase tracking-tighter border border-emerald-100/50">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Active
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-[10px] font-bold text-rose-700 uppercase tracking-tighter border border-rose-100/50">
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-500"></span>
                      Inactive
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 mt-2 border-t border-slate-700 relative z-10">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none">Joined</span>
                    <span className="text-[11px] font-bold text-slate-300 mt-1">{new Date(staff.created_at).toLocaleDateString(undefined, { day:'numeric', month:'short', year:'numeric' })}</span>
                  </div>
                                     <div className="flex items-center gap-2 isolate">
                    {staff.is_active ? (
                      <button
                        onClick={() => handleToggleStatus(staff.id, staff.full_name, false)}
                        disabled={isProcessing === staff.id || isPending}
                        className="text-orange-400 bg-orange-500/20 p-2.5 rounded-xl transition-all active:scale-95 disabled:opacity-50 border border-orange-500/30 shadow-sm"
                        title="Deactivate"
                      >
                        <ShieldBan className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleToggleStatus(staff.id, staff.full_name, true)}
                        disabled={isProcessing === staff.id || isPending}
                        className="text-emerald-400 bg-emerald-500/20 p-2.5 rounded-xl transition-all active:scale-95 disabled:opacity-50 border border-emerald-500/30 shadow-sm"
                        title="Activate"
                      >
                        <ShieldCheck className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(staff)}
                      disabled={isProcessing === staff.id}
                      className="text-blue-400 bg-blue-500/20 p-2.5 rounded-xl transition-all active:scale-95 disabled:opacity-50 border border-blue-500/30 shadow-sm"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(staff.id, staff.full_name)}
                      disabled={isProcessing === staff.id}
                      className="text-rose-400 bg-rose-500/20 p-2.5 rounded-xl transition-all active:scale-95 disabled:opacity-50 border border-rose-500/30 shadow-sm"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop View: Traditional Table */}
        <div className="hidden lg:block flow-root">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <div className="overflow-hidden shadow-2xl ring-1 ring-slate-800 sm:rounded-lg">
                <table className="min-w-full divide-y divide-slate-800">
                  <thead className="bg-slate-950">
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider sm:pl-6">
                        Full Name
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Username
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Added
                      </th>
                      <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 bg-slate-900">
                    {staffList.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center">
                          <UsersRound className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                          <h3 className="text-sm font-medium text-slate-900">No managers found</h3>
                          <p className="mt-1 text-sm text-slate-500">Add a manager so they can start processing sales.</p>
                        </td>
                      </tr>
                    ) : (
                      staffList.map((staff) => (
                        <tr key={staff.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-bold text-slate-200 sm:pl-6">
                            {staff.full_name}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm font-mono text-slate-400">
                            {staff.username}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">
                            {staff.is_active ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-[10px] font-black text-green-700 uppercase tracking-tighter">
                                <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span> Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-black text-red-700 uppercase tracking-tighter">
                                <span className="h-1.5 w-1.5 rounded-full bg-red-500"></span> Inactive
                              </span>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-xs text-slate-500 font-bold">
                            {new Date(staff.created_at).toLocaleDateString()}
                          </td>
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                            <div className="flex justify-end gap-2 isolate">
                              {staff.is_active ? (
                                <button
                                  onClick={() => handleToggleStatus(staff.id, staff.full_name, false)}
                                  disabled={isProcessing === staff.id || isPending}
                                  className="text-orange-400 hover:text-orange-300 bg-orange-500/20 hover:bg-orange-500/30 p-1.5 rounded-lg transition-all shadow-sm disabled:opacity-50"
                                  title="Deactivate Manager"
                                >
                                  <ShieldBan className="w-4 h-4" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleToggleStatus(staff.id, staff.full_name, true)}
                                  disabled={isProcessing === staff.id || isPending}
                                  className="text-emerald-400 hover:text-emerald-300 bg-emerald-500/20 hover:bg-emerald-500/30 p-1.5 rounded-lg transition-all shadow-sm disabled:opacity-50"
                                  title="Reactivate Manager"
                                >
                                  <ShieldCheck className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => handleEdit(staff)}
                                disabled={isProcessing === staff.id}
                                className="text-blue-400 hover:text-blue-300 bg-blue-500/20 hover:bg-blue-500/30 p-1.5 rounded-lg transition-all shadow-sm disabled:opacity-50"
                                title="Edit Manager"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(staff.id, staff.full_name)}
                                disabled={isProcessing === staff.id}
                                className="text-red-400 hover:text-red-300 bg-red-500/20 hover:bg-red-500/30 p-1.5 rounded-lg transition-all shadow-sm disabled:opacity-50"
                                title="Delete Manager"
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
          </div>
        </div>
      </div>

      <StaffModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setActiveStaff(null);
        }}
        storeSlug={storeSlug}
        staff={activeStaff}
      />
    </>
  );
}
