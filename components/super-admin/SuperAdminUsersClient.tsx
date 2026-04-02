"use client";

import { useState } from "react";
import { toggleUserStatus, deleteUserHard } from "@/app/actions/super-admin";
import { toast } from "sonner";
import { User, Ban, Trash2, CheckCircle2, ShieldAlert } from "lucide-react";

type UserData = {
  id: string;
  full_name: string;
  username: string;
  role: string;
  is_active: boolean;
  created_at: string;
  storeName: string;
};

export default function SuperAdminUsersClient({
  users,
}: {
  users: UserData[];
}) {
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [filterRole, setFilterRole] = useState<string>("all");

  const handleToggle = async (id: string, name: string, currentStatus: boolean, role: string) => {
    if (role === "super_admin") {
      toast.error("Cannot modify super_admin status via UI.");
      return;
    }
    setProcessingId(id);
    const targetStatus = !currentStatus;
    const res = await toggleUserStatus(id, targetStatus);
    if (res?.error) toast.error(res.error);
    else toast.success(`User '${name}' is now ${targetStatus ? 'Active' : 'Suspended'}`);
    setProcessingId(null);
  };

  const handleDelete = async (id: string, name: string, role: string) => {
    if (role === "super_admin") {
      toast.error("Cannot delete super_admin via UI.");
      return;
    }

    const confirm = window.confirm(`Permanently delete user ${name}? This action is irreversible.`);
    if (!confirm) return;
    
    setProcessingId(id);
    const res = await deleteUserHard(id);
    if (res?.error) toast.error(res.error);
    else toast.success(`User '${name}' permanently deleted.`);
    setProcessingId(null);
  };

  const filteredUsers = users.filter((u) => {
    if (filterRole === "all") return true;
    return u.role === filterRole;
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-base font-semibold leading-6 text-slate-900">Platform Users</h3>
          <p className="mt-1 text-sm text-slate-500">Every account provisioned across the platform.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <select 
            className="block w-full sm:w-48 rounded-md border-0 py-1.5 text-slate-900 ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
          >
            <option value="all">All Roles</option>
            <option value="super_admin">Super Admins</option>
            <option value="admin">Store Admins</option>
            <option value="manager">Store Managers</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th scope="col" className="py-3 px-6 text-left text-xs font-medium text-slate-500 uppercase">User</th>
              <th scope="col" className="py-3 px-6 text-left text-xs font-medium text-slate-500 uppercase">Role</th>
              <th scope="col" className="py-3 px-6 text-left text-xs font-medium text-slate-500 uppercase">Store Node</th>
              <th scope="col" className="py-3 px-6 text-center text-xs font-medium text-slate-500 uppercase">Status</th>
              <th scope="col" className="py-3 px-6 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-100">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-sm text-slate-500">
                  <User className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  No users found matching criteria.
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50">
                  <td className="py-4 px-6 whitespace-nowrap text-sm text-slate-900">
                    <div className="flex flex-col">
                      <span className="font-semibold">{user.full_name}</span>
                      <span className="text-xs text-slate-500 font-mono">@{user.username}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 whitespace-nowrap text-sm text-slate-600">
                    {user.role === 'super_admin' ? (
                      <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 text-xs font-bold border border-purple-200 flex items-center gap-1 w-fit">
                        <ShieldAlert className="w-3 h-3" /> SYSTEM
                      </span>
                    ) : user.role === 'admin' ? (
                      <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 text-xs font-bold border border-blue-200">
                        Admin
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200">
                        Manager
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-6 whitespace-nowrap text-sm font-medium text-slate-600">
                    {user.storeName || "—"}
                  </td>
                  <td className="py-4 px-6 whitespace-nowrap text-center">
                    {user.is_active ? (
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
                    <div className="flex items-center justify-end gap-2 isolate">
                      <button
                        onClick={() => handleToggle(user.id, user.full_name, user.is_active, user.role)}
                        disabled={processingId === user.id || user.role === "super_admin"}
                        className="text-orange-600 hover:text-orange-900 bg-orange-50 hover:bg-orange-100 p-1.5 rounded transition-colors disabled:opacity-50"
                        title={user.is_active ? "Suspend User" : "Reactivate User"}
                      >
                         {user.is_active ? <Ban className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                      </button>

                      <button
                        onClick={() => handleDelete(user.id, user.full_name, user.role)}
                        disabled={processingId === user.id || user.role === "super_admin"}
                        className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 p-1.5 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Delete User Permanently"
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
