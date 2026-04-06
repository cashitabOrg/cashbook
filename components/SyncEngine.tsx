"use client";

import { useEffect, useRef } from "react";
import { db } from "@/lib/db";
import { createClient } from "@/lib/supabase";
import { toast } from "sonner";

export default function SyncEngine() {
  const isSyncing = useRef(false);
  // Cache the supabase client and user to avoid repeated lock acquisitions
  const supabaseRef = useRef<any>(null);
  if (!supabaseRef.current && typeof window !== 'undefined') {
    supabaseRef.current = createClient();
  }
  const currentUserRef = useRef<any>(null);

  useEffect(() => {
    // Attempt sync immediately on mount if online
    if (typeof window !== "undefined" && navigator.onLine) {
      processQueue();
    }

    const handleOnline = () => {
      toast.success("Connection restored. Synchronizing offline data...");
      processQueue();
    };

    const handleOffline = () => {
      // toast.warning("Connection lost. Working offline.");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Optional: periodic check in case events drop
    const interval = setInterval(() => {
      if (navigator.onLine) processQueue();
    }, 10000); // Check every 10 seconds (was 15)

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
    };
  }, []);

  const processQueue = async () => {
    if (isSyncing.current) return;
    isSyncing.current = true;

    try {
      // Master Reset: Force retry items that failed
      await db.offlineQueue
        .where("status").equals("failed")
        .modify(item => {
             item.status = "pending";
             item.retry_count = 0;
        });

      // Orphan Recovery: Reset items stuck in "syncing" state (left over from
      // a page refresh, browser crash, or component unmount mid-sync).
      // They were never marked complete or failed, so rescue them now.
      await db.offlineQueue
        .where("status").equals("syncing")
        .modify(item => {
          item.status = "pending";
          item.retry_count = (item.retry_count || 0) + 1;
        });

      const pendingItems = await db.offlineQueue.where("status").equals("pending").toArray();
      if (pendingItems.length === 0) {
        isSyncing.current = false;
        return;
      }

      const supabase = supabaseRef.current;
      if (!supabase) return;

      // Only fetch user if we don't have one cached — avoids repeated gotrue lock acquisitions
      if (!currentUserRef.current) {
        const { data: authData } = await supabase.auth.getUser();
        currentUserRef.current = authData?.user ?? null;
      }
      const currentUser = currentUserRef.current;
      let syncedCount = 0;

      // Sort by creation time to preserve chronological integrity
      pendingItems.sort((a, b) => a.created_at - b.created_at);

      for (const item of pendingItems) {
        // Mark as syncing to prevent race conditions
        if (item.id) await db.offlineQueue.update(item.id, { status: "syncing" });

        let success = false;

        try {
          if (item.type === "sale_session") {
            const p = item.payload;
            if (p.action === "close") {
              const { error } = await supabase
                .from("sales_sessions")
                .update({ status: "closed", ended_at: p.ended_at, total_revenue: p.total_revenue })
                .eq("id", p.id);
              success = !error;
            } else {
              // Use upsert with ignoreDuplicates so re-syncing an already-inserted
              // session is silently ignored (INSERT ... ON CONFLICT DO NOTHING).
              // This eliminates 409 Conflict errors on retry after page refresh.
              const { error } = await supabase
                .from("sales_sessions")
                .upsert({
                  id: p.id,
                  store_id: item.store_id,
                  manager_id: p.manager_id,
                  started_at: p.started_at,
                  status: "open",
                  total_revenue: 0,
                }, { onConflict: 'id', ignoreDuplicates: true });
              // Treat unique violations (409) as success since it means the record is already there
              success = !error || error?.code === '23505' || error?.message?.includes('duplicate');
              if (!success) console.error('SyncEngine: Session upsert failed:', error?.message, error?.code);
            }
          } 
          
          else if (item.type === "sale_item") {
            const { local_row_id, ...payload } = item.payload;
            
            // AUTO-RECONSTRUCT: If the session doesn't exist, create a barebones one 
            // so the sale item has a valid parent (FOREIGN KEY resolution)
            const { data: sessionExists } = await supabase
              .from("sales_sessions")
              .select("id")
              .eq("id", payload.session_id)
              .single();

            if (!sessionExists) {
              console.warn(`SyncEngine: Reconstructing missing session ${payload.session_id}`);
              const { error: sessionError } = await supabase
                .from("sales_sessions")
                .upsert({
                  id: payload.session_id,
                  store_id: item.store_id || (currentUser ? currentUser.user_metadata?.store_id : payload.store_id),
                  manager_id: payload.manager_id || currentUser?.id || item.payload.manager_id, 
                  started_at: payload.started_at || new Date(item.created_at).toISOString(),
                  status: "open",
                  total_revenue: 0,
                }, { onConflict: 'id', ignoreDuplicates: true });

              // Treat 409 as success since the goal is just to ensure it exists
              const isDuplicate = sessionError?.code === '23505' || sessionError?.message?.includes('duplicate');
              if (sessionError && !isDuplicate) {
                  console.error('SyncEngine: Session reconstruction failed:', sessionError.message);
                  if (item.id) await db.offlineQueue.update(item.id, { status: "failed" });
                  continue;
              }
            }

            // Use upsert + ignoreDuplicates so re-syncing the same sale item
            // after a page refresh doesn't cause a 409 Conflict.
            const { error } = await supabase.from("sale_items").upsert({
              id: local_row_id, // Use the POS-generated UUID as the DB primary key
              store_id: item.store_id,
              session_id: payload.session_id,
              product_id: payload.product_id,
              quantity: payload.quantity,
              subtotal: payload.subtotal,
              unit_price: payload.unit_price || 0,
              unit_cost: payload.unit_cost || 0,
              created_at: new Date(item.created_at).toISOString()
            }, { onConflict: 'id', ignoreDuplicates: true });
            success = !error || error?.code === '23505' || error?.message?.includes('duplicate');
            
            if (!success) {
              console.error('SyncEngine: Sale item rejected:', error.message, error.code);
              
              if (error.code === '23503') {
                // 23503 is Foreign Key Violation. The product or session was deleted from the DB!
                console.error("FATAL: Product or Session no longer exists in DB. Cancelling sync for this item.");
                if (item.id) await db.offlineQueue.update(item.id, { status: "fatal" });
                continue;
              }
              
              if (error.message.includes('permission denied') || error.message.includes('trigger')) {
                toast.error("Database Permission Error: Contact your store administrator.", {
                  description: "Your sales are waiting in a queue until the database permission is fixed.",
                  duration: 10000
                });
              }
            }
          } 
          
          else if (item.type === "sale_item_delete") {
            const { local_row_id } = item.payload;
            // Delete from cloud using the POS-generated UUID (which is the DB PK)
            const { error } = await supabase
              .from("sale_items")
              .delete()
              .eq("id", local_row_id);
            // Treat 404 (already deleted) or success as success
            success = !error;
          } 
          
          // The 'stock_decrement' type is now handled automatically by Database Triggers
          // when 'sale_item' records are synced. This prevent double-deduction.
          else if (item.type === "stock_decrement") {
            success = true; // Mark as done to clear from queue
          }

          if (success && item.id) {
            await db.offlineQueue.delete(item.id);
            syncedCount++;
          } else if (item.id) {
             await db.offlineQueue.update(item.id, { status: "failed" });
          }
        } catch (e: any) {
          console.error("Sync error for item", item, e);
          if (item.id) await db.offlineQueue.update(item.id, { status: "failed" });
          // If it's a critical network error, toast it
          if (e.message?.includes('fetch failed')) {
            toast.error("Cloud Connection Error: Retrying in the background...");
          }
        }
      }

      if (syncedCount > 0) {
        toast.success(`Successfully synchronized ${syncedCount} queued actions to the cloud.`);
      }

    } catch (e) {
      console.error("Queue processing error", e);
    } finally {
      isSyncing.current = false;
    }
  };

  return null; // This is a headless orchestrator component
}
