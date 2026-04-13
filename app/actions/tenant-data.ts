"use server";

import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase-admin";
import { logAdminAction } from "@/lib/auditlogger";
import { revalidatePath } from "next/cache";

export async function wipeTenantData(storeId: string) {
  try {
    const profile = await requireRole(["super_admin"]);
    const adminClient = createAdminClient();

    // Verify store exists
    const { data: store, error: fetchErr } = await adminClient
      .from("stores")
      .select("slug, name")
      .eq("id", storeId)
      .single();

    if (fetchErr || !store) return { error: "Store not found" };

    // 1. Delete all sessions (this cascades to session_items usually based on schema)
    const { error: sessErr } = await adminClient
      .from("sales_sessions")
      .delete()
      .eq("store_id", storeId);
    
    // 2. Delete all products
    const { error: prodErr } = await adminClient
      .from("products")
      .delete()
      .eq("store_id", storeId);

    if (sessErr || prodErr) {
      throw new Error("Failed to clear tenant core data.");
    }

    await logAdminAction("WIPE_TENANT_DATA", profile.id, storeId, {
      storeName: store.name,
      deletedSessions: true,
      deletedProducts: true
    });

    revalidatePath(`/super-admin/stores/${store.slug}`);
    return { success: true };
  } catch (e: any) {
    return { error: e.message || "Wipe failed" };
  }
}

export async function exportTenantData(storeId: string) {
  try {
    const profile = await requireRole(["super_admin"]);
    const adminClient = createAdminClient();

    const [productsRes, sessionsRes, usersRes] = await Promise.all([
      adminClient.from("products").select("*").eq("store_id", storeId),
      adminClient.from("sales_sessions").select("*").eq("store_id", storeId),
      adminClient.from("users").select("*").eq("store_id", storeId)
    ]);

    const payload = {
      products: productsRes.data || [],
      sales_sessions: sessionsRes.data || [],
      users: usersRes.data || [],
      exported_at: new Date().toISOString()
    };

    await logAdminAction("DATA_EXPORT", profile.id, storeId, {
      productCount: payload.products.length,
      sessionCount: payload.sales_sessions.length
    });

    // We return JSON string to client so they can trigger download
    return { success: true, data: JSON.stringify(payload, null, 2) };
  } catch (e: any) {
    return { error: e.message || "Export failed" };
  }
}
