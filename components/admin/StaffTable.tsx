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
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold leading-7 text-slate-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Staff Management
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Manage your store managers. They will use their assigned username to log into the Point of Sale.
          </p>
        </div>
        <div className="mt-4 sm:ml-4 sm:mt-0 items-center flex gap-3">
          <button
            type="button"
            onClick={handleAddNew}
            className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-colors"
          >
            <UserPlus className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
            Add Manager
          </button>
        </div>
      </div>

      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-slate-300">
                <thead className="bg-slate-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-slate-900 sm:pl-6">
                      Full Name
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">
                      Login Username
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">
                      Status
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">
                      Added On
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6 text-right text-sm font-semibold text-slate-900">
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
                      <tr key={staff.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-slate-900 sm:pl-6 bg-white shrink">
                          {staff.full_name}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm font-mono text-slate-600">
                          {staff.username}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">
                          {staff.is_active ? (
                            <span className="inline-flex items-center gap-1.5 rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                              <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span> Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10">
                              <span className="h-1.5 w-1.5 rounded-full bg-red-500"></span> Inactive
                            </span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">
                          {new Date(staff.created_at).toLocaleDateString()}
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <div className="flex justify-end gap-2 isolate">
                            {staff.is_active ? (
                              <button
                                onClick={() => handleToggleStatus(staff.id, staff.full_name, false)}
                                disabled={isProcessing === staff.id || isPending}
                                className="text-orange-600 hover:text-orange-900 bg-orange-50 hover:bg-orange-100 p-1.5 rounded transition-colors disabled:opacity-50"
                                title="Deactivate Manager"
                              >
                                <ShieldBan className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleToggleStatus(staff.id, staff.full_name, true)}
                                disabled={isProcessing === staff.id || isPending}
                                className="text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100 p-1.5 rounded transition-colors disabled:opacity-50"
                                title="Reactivate Manager"
                              >
                                <ShieldCheck className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleEdit(staff)}
                              disabled={isProcessing === staff.id}
                              className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 p-1.5 rounded transition-colors disabled:opacity-50"
                              title="Edit Manager"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(staff.id, staff.full_name)}
                              disabled={isProcessing === staff.id}
                              className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 p-1.5 rounded transition-colors disabled:opacity-50"
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
