import { createAdminClient } from "@/lib/supabase-admin";
import { requireRole } from "@/lib/auth";
import { Search, History, AlertTriangle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SuperAdminAuditLogsPage() {
  await requireRole(["super_admin"]);
  const adminClient = createAdminClient();

  const { data: rawLogs, error } = await adminClient
    .from("admin_audit_logs")
    .select(`
      id,
      action_type,
      entity_id,
      actor_id,
      details,
      created_at
    `)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    if (error.code === '42P01') {
      return <div className="p-8 text-slate-500">Waiting for audit logs schema initialization...</div>;
    }
    return <div className="p-8 text-red-600 font-bold">Failed to load audit logs: {error.message}</div>;
  }

  // Manually join public.users since the foreign key points to auth.users natively
  const actorIds = [...new Set(rawLogs?.map(l => l.actor_id).filter(Boolean) as string[])];
  let usersMap: Record<string, { full_name: string, email: string }> = {};

  if (actorIds.length > 0) {
    const { data: users } = await adminClient
      .from("users")
      .select("id, full_name, email")
      .in("id", actorIds);
    
    if (users) {
      usersMap = users.reduce((acc, user) => {
        acc[user.id] = user;
        return acc;
      }, {} as Record<string, any>);
    }
  }

  const logs = rawLogs?.map(log => ({
    ...log,
    users: log.actor_id ? usersMap[log.actor_id] : null
  }));

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Security Audit Trail</h1>
        <p className="mt-2 text-sm text-slate-600">
          Chronological record of high-sensitivity administrative and destructive actions across all tenants.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2 text-slate-700">
            <History className="w-5 h-5 text-indigo-500" />
            <h3 className="font-semibold text-base">Recent Activity Logs</h3>
          </div>
          <span className="text-sm font-medium text-slate-500">Showing last 100 events</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="py-3 px-6 text-left text-xs font-medium text-slate-500 uppercase">Timestamp</th>
                <th scope="col" className="py-3 px-6 text-left text-xs font-medium text-slate-500 uppercase">Actor</th>
                <th scope="col" className="py-3 px-6 text-left text-xs font-medium text-slate-500 uppercase">Action</th>
                <th scope="col" className="py-3 px-6 text-left text-xs font-medium text-slate-500 uppercase">Target Entity</th>
                <th scope="col" className="py-3 px-6 text-left text-xs font-medium text-slate-500 uppercase">Metadata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {!logs || logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-sm text-slate-500">No high-sensitivity actions recorded yet.</td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="py-4 px-6 whitespace-nowrap text-xs text-slate-500 font-mono">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap text-sm text-slate-900">
                      {/* @ts-ignore */}
                      {log.users ? <div className="flex flex-col"><span className="font-semibold">{log.users.full_name}</span><span className="text-xs text-slate-500">{log.users.email}</span></div> : <span className="text-slate-400 italic">System</span>}
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap text-sm font-semibold text-slate-700 uppercase tracking-wide">
                      {log.action_type.includes('DELETE') || log.action_type.includes('WIPE') 
                        ? <span className="text-red-600 flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> {log.action_type}</span> 
                        : log.action_type}
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap text-sm text-slate-600 font-mono text-xs">
                      {log.entity_id || "N/A"}
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-500 max-w-xs truncate">
                      {JSON.stringify(log.details)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
