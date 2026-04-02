"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import StaffModal from "./StaffModal";
import { deleteManager, toggleManagerStatus } from "@/app/actions/staff";
import { toast } from "sonner";
import { UserPlus, Edit, Trash2, ShieldBan, ShieldCheck, UsersRound } from "lucide-react";

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
}: {
  storeSlug: string;
  staffList: Staff[];
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [activeStaff, setActiveStaff] = useState<Staff | null>(null);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

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
      <div className="bg-white lg:rounded-xl lg:shadow-sm lg:border border-slate-200 px-4 lg:px-6 py-4 flex items-center justify-between mb-2 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-500/20">
            <UsersRound className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm lg:text-xl font-black text-slate-900 tracking-tight leading-none">Team</h1>
            <p className="text-[8px] lg:text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Staff Management</p>
          </div>
        </div>
        
        <button
          type="button"
          onClick={handleAddNew}
          className="relative z-10 inline-flex items-center rounded-xl bg-slate-900 px-3 py-2 lg:px-4 lg:py-2 text-[10px] font-black text-white shadow-lg hover:bg-slate-800 transition-all active:scale-95 gap-2 uppercase tracking-widest"
        >
          <UserPlus className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
          <span className="hidden sm:inline">Add Manager</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>

      <div className="px-2 lg:px-0">
        <div className="mt-8 flow-root">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                <table className="min-w-full divide-y divide-slate-300">
                  <thead className="bg-slate-50">
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
                  <tbody className="divide-y divide-slate-200 bg-white">
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
                        <tr key={staff.id} className="hover:bg-slate-50 transition-colors">
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-bold text-slate-900 sm:pl-6">
                            {staff.full_name}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm font-mono text-slate-600">
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
                          <td className="whitespace-nowrap px-3 py-4 text-xs text-slate-400 font-bold">
                            {new Date(staff.created_at).toLocaleDateString()}
                          </td>
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                            <div className="flex justify-end gap-2 isolate">
                              {staff.is_active ? (
                                <button
                                  onClick={() => handleToggleStatus(staff.id, staff.full_name, false)}
                                  disabled={isProcessing === staff.id || isPending}
                                  className="text-orange-600 hover:text-orange-900 bg-orange-50 hover:bg-orange-100 p-1.5 rounded-lg transition-all shadow-sm disabled:opacity-50"
                                  title="Deactivate Manager"
                                >
                                  <ShieldBan className="w-4 h-4" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleToggleStatus(staff.id, staff.full_name, true)}
                                  disabled={isProcessing === staff.id || isPending}
                                  className="text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100 p-1.5 rounded-lg transition-all shadow-sm disabled:opacity-50"
                                  title="Reactivate Manager"
                                >
                                  <ShieldCheck className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => handleEdit(staff)}
                                disabled={isProcessing === staff.id}
                                className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 p-1.5 rounded-lg transition-all shadow-sm disabled:opacity-50"
                                title="Edit Manager"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(staff.id, staff.full_name)}
                                disabled={isProcessing === staff.id}
                                className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 p-1.5 rounded-lg transition-all shadow-sm disabled:opacity-50"
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
