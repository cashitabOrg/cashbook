"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireRole } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function toggleStoreStatus(storeId: string, isActive: boolean) {
  await requireRole(["super_admin"]);
  const adminClient = supabaseAdmin;

  // Deactivating a store should ideally cascade or logically block logins
  // By setting is_active = false, proxy or auth logic can reject.
  const { error } = await adminClient
    .from("stores")
    .update({ is_active: isActive })
    .eq("id", storeId);

  if (error) return { error: error.message };
  
  // Also deactivate all users belonging to this store
  await adminClient
    .from("users")
    .update({ is_active: isActive })
    .eq("store_id", storeId);

  revalidatePath("/super-admin/dashboard");
  revalidatePath("/super-admin/stores/[storeSlug]", "page");
  return { success: true };
}

export async function toggleBillingExemption(storeId: string, isExempt: boolean) {
  await requireRole(["super_admin"]);
  const adminClient = supabaseAdmin;

  const { error } = await adminClient
    .from("stores")
    .update({ is_billing_exempt: isExempt })
    .eq("id", storeId);

  if (error) return { error: error.message };

  revalidatePath("/super-admin/dashboard");
  revalidatePath("/super-admin/stores/[storeSlug]", "page");
  return { success: true };
}

export async function deleteStoreHard(storeId: string) {
  await requireRole(["super_admin"]);
  const adminClient = supabaseAdmin;

  // Because of RLS and CASCADE constraints, deleting the store should delete products, sessions, etc.
  // We MUST also delete the Auth users.
  
  // 1. Find all users for this store
  const { data: users } = await adminClient
    .from("users")
    .select("id")
    .eq("store_id", storeId);
    
  // 2. Delete the store. Cascade handles the public schema objects.
  const { error } = await adminClient
    .from("stores")
    .delete()
    .eq("id", storeId);

  if (error) return { error: error.message };

  // 3. Delete from Auth (Admin API)
  if (users && users.length > 0) {
    for (const u of users) {
      await adminClient.auth.admin.deleteUser(u.id);
    }
  }

  revalidatePath("/super-admin/dashboard");
  return { success: true };
}

export async function toggleUserStatus(userId: string, isActive: boolean) {
  await requireRole(["super_admin"]);
  const adminClient = supabaseAdmin;

  const { error } = await adminClient
    .from("users")
    .update({ is_active: isActive })
    .eq("id", userId);

  if (error) return { error: error.message };

  revalidatePath("/super-admin/users");
  return { success: true };
}

export async function deleteUserHard(userId: string) {
  await requireRole(["super_admin"]);
  const adminClient = supabaseAdmin;

  // Delete from Auth API
  const { error: authError } = await adminClient.auth.admin.deleteUser(userId);
  if (authError) return { error: authError.message };

  // Delete from public table
  await adminClient.from("users").delete().eq("id", userId);

  revalidatePath("/super-admin/users");
  return { success: true };
}

export async function updateStorePlan(storeId: string, plan: string) {
  await requireRole(["super_admin"]);
  const adminClient = supabaseAdmin;

  const { error } = await adminClient
    .from("stores")
    .update({ plan })
    .eq("id", storeId);

  if (error) return { error: error.message };

  revalidatePath("/super-admin/plans");
  return { success: true };
}
