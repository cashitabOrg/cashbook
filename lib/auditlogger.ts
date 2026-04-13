"use server";

import { createAdminClient } from "@/lib/supabase-admin";

export async function logAdminAction(
  actionType: string, 
  actorId: string | null, 
  entityId: string | null = null, 
  details: Record<string, any> = {}
) {
  try {
    const adminClient = createAdminClient();
    const { error } = await adminClient.from("admin_audit_logs").insert({
      action_type: actionType,
      actor_id: actorId,
      entity_id: entityId,
      details: details
    });
    
    if (error) {
      console.warn("Failed to log admin action:", error.message);
    }
  } catch (e) {
    console.error("Audit log error:", e);
  }
}
