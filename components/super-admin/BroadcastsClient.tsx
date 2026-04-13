"use client";

import { useState } from "react";
import { createBroadcast, toggleBroadcast } from "@/app/actions/broadcasts";
import { Megaphone, Trash2, CheckCircle2, Ban } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function BroadcastsClient({ broadcasts }: { broadcasts: any[] }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const res = await createBroadcast(formData);
    setIsSubmitting(false);

    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Broadcast created successfully");
      (e.target as HTMLFormElement).reset();
    }
  };

  const handleToggle = async (id: string, currentStatus: boolean) => {
    const res = await toggleBroadcast(id, currentStatus);
    if (res.error) toast.error(res.error);
    else toast.success(currentStatus ? "Broadcast disabled" : "Broadcast enabled");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      {/* Create Form */}
      <div className="col-span-1">
        <form onSubmit={handleCreate} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
           <h3 className="text-lg font-semibold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
             <Megaphone className="w-5 h-5 text-blue-600" /> New Broadcast
           </h3>
           
           <div>
             <label htmlFor="title" className="block text-sm font-medium leading-6 text-slate-900">Title (Short)</label>
             <input type="text" name="title" id="title" required className="mt-2 block w-full rounded-md border-0 py-1.5 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6" placeholder="Scheduled Maintenance" />
           </div>

           <div>
             <label htmlFor="message" className="block text-sm font-medium leading-6 text-slate-900">Message</label>
             <textarea name="message" id="message" rows={3} required className="mt-2 block w-full rounded-md border-0 py-1.5 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6" placeholder="The system will go offline for 10 minutes at midnight..."></textarea>
           </div>

           <div>
             <label htmlFor="type" className="block text-sm font-medium leading-6 text-slate-900">Color Type</label>
             <select name="type" id="type" className="mt-2 block w-full rounded-md border-0 py-1.5 text-slate-900 ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6">
               <option value="info">Info (Blue)</option>
               <option value="warning">Warning (Yellow)</option>
               <option value="danger">Danger (Red)</option>
             </select>
           </div>

           <button type="submit" disabled={isSubmitting} className="w-full mt-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-4 rounded-md transition-colors disabled:opacity-50">
             {isSubmitting ? "Publishing..." : "Publish Broadcast"}
           </button>
        </form>
      </div>

      {/* History */}
      <div className="col-span-1 lg:col-span-2">
         <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 bg-slate-50">
              <h3 className="text-base font-semibold text-slate-900">Broadcast History</h3>
            </div>
            <ul className="divide-y divide-slate-100">
              {broadcasts.length === 0 ? (
                <li className="p-6 text-center text-slate-500 text-sm">No broadcasts created yet.</li>
              ) : (
                broadcasts.map(b => (
                  <li key={b.id} className="p-6 flex flex-col sm:flex-row justify-between items-start gap-4 hover:bg-slate-50 transition-colors">
                    <div className="space-y-1 w-full flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${
                          b.type === 'danger' ? 'bg-red-100 text-red-700' :
                          b.type === 'warning' ? 'bg-amber-100 text-amber-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {b.type}
                        </span>
                        <h4 className="font-semibold text-slate-900">{b.title}</h4>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed pr-4">{b.message}</p>
                      <p className="text-xs text-slate-400 font-mono mt-2 flex items-center gap-1">
                         {new Date(b.created_at).toLocaleString()}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-3 shrink-0">
                       <span className="text-sm font-medium text-slate-500 mr-2 flex items-center gap-1 border-r border-slate-200 pr-4">
                         STATUS: 
                         {b.is_active ? 
                           <span className="text-green-600 flex items-center gap-1"><CheckCircle2 className="w-4 h-4"/> LIVE</span> : 
                           <span className="text-slate-400 flex items-center gap-1"><Ban className="w-4 h-4"/> OFF</span>
                         }
                       </span>
                       <button
                          onClick={() => handleToggle(b.id, b.is_active)}
                          className={`text-sm px-3 py-1.5 rounded-md font-medium transition-colors ${
                            b.is_active 
                              ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                              : 'bg-green-50 text-green-600 hover:bg-green-100'
                          }`}
                        >
                          {b.is_active ? "Retract" : "Republish"}
                        </button>
                    </div>
                  </li>
                ))
              )}
            </ul>
         </div>
      </div>

    </div>
  );
}
