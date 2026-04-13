"use client";

import { useEffect, useState } from "react";
import { Megaphone, X } from "lucide-react";
import { createClient } from "@/lib/supabase";

export default function GlobalBroadcastBanner() {
  const [broadcasts, setBroadcasts] = useState<any[]>([]);
  const [dismissed, setDismissed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Load dismissed state from localStorage if available
    try {
      const stored = localStorage.getItem("dismissed_broadcasts");
      if (stored) setDismissed(JSON.parse(stored));
    } catch(e) {}

    const fetchBroadcasts = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("system_broadcasts")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      
      if (data) setBroadcasts(data);
    };

    fetchBroadcasts();
  }, []);

  const handleDismiss = (id: string) => {
    const newDismissed = { ...dismissed, [id]: true };
    setDismissed(newDismissed);
    try {
      localStorage.setItem("dismissed_broadcasts", JSON.stringify(newDismissed));
    } catch(e) {}
  };

  const activeBroadcasts = broadcasts.filter(b => !dismissed[b.id]);

  if (activeBroadcasts.length === 0) return null;

  return (
    <div className="flex flex-col w-full z-50">
      {activeBroadcasts.map((b) => {
        const bgClass = b.type === "danger" ? "bg-red-600" :
                        b.type === "warning" ? "bg-amber-500" : "bg-blue-600";
        
        return (
          <div key={b.id} className={`${bgClass} px-6 py-3 text-white shadow-sm flex items-start sm:items-center gap-3 justify-between`}>
            <div className="flex items-start sm:items-center gap-3">
              <Megaphone className="w-5 h-5 shrink-0 opacity-80 mt-0.5 sm:mt-0" />
              <div>
                <p className="text-sm font-medium leading-snug">
                  <strong className="mr-2 opacity-100">{b.title}:</strong>
                  <span className="opacity-90">{b.message}</span>
                </p>
              </div>
            </div>
            <button 
              onClick={() => handleDismiss(b.id)}
              className="text-white hover:bg-black/10 p-1 rounded transition-colors shrink-0"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
