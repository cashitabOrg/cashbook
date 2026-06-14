"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js";

interface DatabasePayload {
  table: string;
  eventType: string;
  new?: Record<string, unknown> | null;
  old?: Record<string, unknown> | null;
}

export default function RealtimeSyncListener({ storeId }: { storeId: string }) {
  const router = useRouter();
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!storeId) return;

    const supabase = createClient();
    const activeChannels: RealtimeChannel[] = [];

    // Centralized handler with 300ms debounce
    const handleDatabaseChange = (payload: DatabasePayload) => {
      // 1. Dispatch a CustomEvent for client-only components (like LedgerClient)
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("realtime-sync", {
            detail: {
              table: payload.table,
              eventType: payload.eventType,
              new: payload.new,
              old: payload.old,
            },
          })
        );
      }

      // 2. Debounce router.refresh() to prevent spamming server requests in bulk transactions
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        console.log("[RealtimeSyncListener] Triggering router.refresh() for table changes.");
        router.refresh();
      }, 300);
    };

    // Table names that are scoped to storeId
    const storeScopedTables = [
      "sales_sessions",
      "sale_items",
      "products",
      "stock_adjustments",
      "users",
      "inventory_movements",
    ];

    // Subscribe to each table
    storeScopedTables.forEach((tableName) => {
      const channel = supabase
        .channel(`sync-${tableName}-${storeId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: tableName,
            filter: `store_id=eq.${storeId}`,
          },
          (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
            console.log(`[RealtimeSyncListener] Received change on ${tableName}:`, payload.eventType);
            handleDatabaseChange({
              table: tableName,
              eventType: payload.eventType,
              new: payload.new,
              old: payload.old,
            });
          }
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            console.log(`[RealtimeSyncListener] Subscribed to ${tableName} changes for store ${storeId}`);
          }
        });

      activeChannels.push(channel);
    });

    // Subscribe to stores table updates (filtered by stores primary key: id)
    const storeMetaChannel = supabase
      .channel(`sync-stores-meta-${storeId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "stores",
          filter: `id=eq.${storeId}`,
        },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          console.log("[RealtimeSyncListener] Received store meta change:", payload.eventType);
          handleDatabaseChange({
            table: "stores",
            eventType: payload.eventType,
            new: payload.new,
            old: payload.old,
          });
        }
      )
      .subscribe();

    activeChannels.push(storeMetaChannel);

    // Cleanup subscriptions on unmount
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      activeChannels.forEach((channel) => {
        supabase.removeChannel(channel);
      });
    };
  }, [storeId, router]);

  return null; // Side-effect only component
}
