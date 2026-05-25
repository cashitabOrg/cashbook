import { UsersRound, ShieldBan, ShieldCheck, Edit, Trash2 } from "lucide-react";

type Staff = {
  id: string;
  full_name: string;
  username: string;
  is_active: boolean;
  created_at: string;
};

type StaffMobileListProps = {
  staffList: Staff[];
  isProcessing: string | null;
  isPending: boolean;
  handleToggleStatus: (id: string, name: string, status: boolean) => void;
  handleEdit: (staff: Staff) => void;
  handleDelete: (id: string, name: string) => void;
};

export default function StaffMobileList({
  staffList,
  isProcessing,
  isPending,
  handleToggleStatus,
  handleEdit,
  handleDelete
}: StaffMobileListProps) {
  return (
    <div className="lg:hidden space-y-4">
      {staffList.length === 0 ? (
        <div className="bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-[#2C2C2E] rounded-2xl p-12 text-center shadow-sm dark:shadow-2xl transition-colors">
          <UsersRound className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600 mb-3" />
          <h3 className="text-sm font-medium text-gray-900 dark:text-white">No managers found</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Add a manager so they can start processing sales.</p>
        </div>
      ) : (
        staffList.map((staff) => (
          <div key={staff.id} className="bg-white dark:bg-[#1C1C1E] p-4 rounded-2xl border border-gray-200 dark:border-[#2C2C2E] shadow-sm dark:shadow-2xl relative group overflow-hidden transition-all active:ring-2 active:ring-blue-500/20">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="flex-1 min-w-0 pr-2">
                <h3 className="text-base font-bold text-gray-900 dark:text-white truncate tracking-tight">{staff.full_name}</h3>
                <p className="text-[11px] font-mono text-gray-500 dark:text-gray-400 mt-0.5">@{staff.username}</p>
              </div>
              
              {staff.is_active ? (
                <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-tighter border border-emerald-100/50 dark:border-emerald-500/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Active
                </span>
              ) : (
                <span className="flex items-center gap-1.5 rounded-full bg-rose-50 dark:bg-rose-500/10 px-2.5 py-1 text-[10px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-tighter border border-rose-100/50 dark:border-rose-500/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-500"></span>
                  Inactive
                </span>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 mt-2 border-t border-gray-100 dark:border-[#2C2C2E] relative z-10">
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest leading-none">Joined</span>
                <span className="text-[11px] font-bold text-gray-900 dark:text-gray-300 mt-1">{new Date(staff.created_at).toLocaleDateString(undefined, { day:'numeric', month:'short', year:'numeric' })}</span>
              </div>
              <div className="flex items-center gap-2 isolate">
                {staff.is_active ? (
                  <button
                    onClick={() => handleToggleStatus(staff.id, staff.full_name, false)}
                    disabled={isProcessing === staff.id || isPending}
                    className="text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/20 p-2.5 rounded-xl transition-all active:scale-95 disabled:opacity-50 border border-orange-200 dark:border-orange-500/30 shadow-sm"
                    title="Deactivate"
                  >
                    <ShieldBan className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => handleToggleStatus(staff.id, staff.full_name, true)}
                    disabled={isProcessing === staff.id || isPending}
                    className="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/20 p-2.5 rounded-xl transition-all active:scale-95 disabled:opacity-50 border border-emerald-200 dark:border-emerald-500/30 shadow-sm"
                    title="Activate"
                  >
                    <ShieldCheck className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => handleEdit(staff)}
                  disabled={isProcessing === staff.id}
                  className="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/20 p-2.5 rounded-xl transition-all active:scale-95 disabled:opacity-50 border border-blue-200 dark:border-blue-500/30 shadow-sm"
                  title="Edit"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(staff.id, staff.full_name)}
                  disabled={isProcessing === staff.id}
                  className="text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/20 p-2.5 rounded-xl transition-all active:scale-95 disabled:opacity-50 border border-rose-200 dark:border-rose-500/30 shadow-sm"
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
  );
}
