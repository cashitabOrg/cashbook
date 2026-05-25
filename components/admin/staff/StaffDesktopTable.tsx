import { UsersRound, ShieldBan, ShieldCheck, Edit, Trash2 } from "lucide-react";

type Staff = {
  id: string;
  full_name: string;
  username: string;
  is_active: boolean;
  created_at: string;
};

type StaffDesktopTableProps = {
  staffList: Staff[];
  isProcessing: string | null;
  isPending: boolean;
  handleToggleStatus: (id: string, name: string, status: boolean) => void;
  handleEdit: (staff: Staff) => void;
  handleDelete: (id: string, name: string) => void;
};

export default function StaffDesktopTable({
  staffList,
  isProcessing,
  isPending,
  handleToggleStatus,
  handleEdit,
  handleDelete
}: StaffDesktopTableProps) {
  return (
    <div className="hidden lg:block flow-root">
      <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
          <div className="overflow-hidden shadow-sm dark:shadow-2xl ring-1 ring-gray-200 dark:ring-[#2C2C2E] sm:rounded-lg transition-colors">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-[#2C2C2E]">
              <thead className="bg-gray-50 dark:bg-[#252528]">
                <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider sm:pl-6">
                    Full Name
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Username
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Added
                  </th>
                  <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-[#2C2C2E] bg-white dark:bg-[#1C1C1E]">
                {staffList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center">
                      <UsersRound className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600 mb-3" />
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">No managers found</h3>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Add a manager so they can start processing sales.</p>
                    </td>
                  </tr>
                ) : (
                  staffList.map((staff) => (
                    <tr key={staff.id} className="hover:bg-gray-50 dark:hover:bg-[#2C2C2E]/50 transition-colors">
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-bold text-gray-900 dark:text-gray-200 sm:pl-6">
                        {staff.full_name}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm font-mono text-gray-500 dark:text-gray-400">
                        {staff.username}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {staff.is_active ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-tighter">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 dark:bg-red-500/10 px-2.5 py-1 text-[10px] font-black text-red-700 dark:text-red-400 uppercase tracking-tighter">
                            <span className="h-1.5 w-1.5 rounded-full bg-red-500"></span> Inactive
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-xs text-gray-500 dark:text-gray-400 font-bold">
                        {new Date(staff.created_at).toLocaleDateString()}
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <div className="flex justify-end gap-2 isolate">
                          {staff.is_active ? (
                            <button
                              onClick={() => handleToggleStatus(staff.id, staff.full_name, false)}
                              disabled={isProcessing === staff.id || isPending}
                              className="text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 bg-orange-50 dark:bg-orange-500/20 hover:bg-orange-100 dark:hover:bg-orange-500/30 p-1.5 rounded-lg transition-all shadow-sm disabled:opacity-50"
                              title="Deactivate Manager"
                            >
                              <ShieldBan className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleToggleStatus(staff.id, staff.full_name, true)}
                              disabled={isProcessing === staff.id || isPending}
                              className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/20 hover:bg-emerald-100 dark:hover:bg-emerald-500/30 p-1.5 rounded-lg transition-all shadow-sm disabled:opacity-50"
                              title="Reactivate Manager"
                            >
                              <ShieldCheck className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleEdit(staff)}
                            disabled={isProcessing === staff.id}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-500/20 hover:bg-blue-100 dark:hover:bg-blue-500/30 p-1.5 rounded-lg transition-all shadow-sm disabled:opacity-50"
                            title="Edit Manager"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(staff.id, staff.full_name)}
                            disabled={isProcessing === staff.id}
                            className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 bg-red-50 dark:bg-red-500/20 hover:bg-red-100 dark:hover:bg-red-500/30 p-1.5 rounded-lg transition-all shadow-sm disabled:opacity-50"
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
  );
}
