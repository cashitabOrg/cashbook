"use server";

import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase-admin";
import { revalidatePath } from "next/cache";

export async function createBroadcast(formData: FormData) {
  try {
    await requireRole(["super_admin"]);
    const adminClient = createAdminClient();

    const title = formData.get("title")?.toString();
    const message = formData.get("message")?.toString();
    const type = formData.get("type")?.toString() || "info";

    if (!title || !message) {
      return { error: "Title and message are required." };
    }

    const { error } = await adminClient
      .from("system_broadcasts")
      .insert({ title, message, type });

    if (error) throw error;

    revalidatePath("/", "layout");
    revalidatePath("/super-admin/broadcasts");
    return { success: true };
  } catch (e: any) {
    return { error: e.message || "Failed to create broadcast" };
  }
}

export async function toggleBroadcast(id: string, currentStatus: boolean) {
  try {
    await requireRole(["super_admin"]);
    const adminClient = createAdminClient();

    const { error } = await adminClient
      .from("system_broadcasts")
      .update({ is_active: !currentStatus })
      .eq("id", id);

    if (error) throw error;

    revalidatePath("/", "layout");
    revalidatePath("/super-admin/broadcasts");
    return { success: true };
  } catch (e: any) {
    return { error: e.message || "Failed to toggle broadcast" };
  }
}
