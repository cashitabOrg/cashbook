"use server";

import { createClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireRole } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { getPlanLimits } from "@/lib/plans";
import { checkActiveSubscription } from "./billing";

export async function createManager(storeSlug: string, formData: FormData) {
  const userRole = await requireRole(["admin", "super_admin"]);
  const adminClient = supabaseAdmin;

  // 0. Check for expired subscription
  const subStatus = await checkActiveSubscription(userRole.storeId);
  if (!subStatus.active) return { error: subStatus.error };

  // 1. Get current store plan limits
  const { checkPlanLimit } = require("@/lib/planEnforcement");
  const limitCheck = await checkPlanLimit(userRole.storeId, 'add_staff');
  
  if (!limitCheck.allowed) {
    return {
      error: `Upgrade required: The active plan limit of ${limitCheck.limit} staff members has been reached. Please upgrade to the ${limitCheck.nextPlan?.toUpperCase()} plan (${limitCheck.nextPrice}) to add more staff.`
    };
  }

  const fullName = formData.get("fullName") as string;
  const username = formData.get("username") as string;
  // Use a generated dummy email or username-based email since Supabase Auth requires email by default
  // Some configs allow username-only, but let's assume standard email auth
  // We'll generate a dummy email and they login with it, or we enforce username uniqueness natively via Supabase if setup.
  // Standard Supabase Auth uses email. Let's create an email from username and storeSlug to be unique.
  const password = formData.get("password") as string;
  // Sanitize username and storeSlug to ensure a valid email format for Supabase Auth
  const cleanUsername = username.toLowerCase().replace(/[^a-z0-9]/g, "");
  const cleanSlug = storeSlug.toLowerCase().replace(/[^a-z0-9]/g, "");
  const email = `${cleanUsername}@${cleanSlug}.frozenpos.local`;

  // Use the admin client to create the user account (bypasses RLS & Auth protections)

  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError) {
    return { error: `Auth Error: ${authError.message}` };
  }

  if (!authData.user) {
    return { error: "Failed to create user account" };
  }

  // Upsert into public.users to handle conflicts with the on_auth_user_created trigger
  const { error: dbError } = await adminClient.from("users").upsert({
    id: authData.user.id,
    full_name: fullName,
    username,
    email,
    role: "manager",
    store_id: userRole.storeId,
  });

  if (dbError) {
    // Attempt rollback
    await adminClient.auth.admin.deleteUser(authData.user.id);
    return { error: `Database Error: ${dbError.message}` };
  }

  revalidatePath(`/${storeSlug}/admin/staff`);
  return { success: true };
}

export async function editManager(storeSlug: string, formData: FormData) {
  const userRole = await requireRole(["admin", "super_admin"]);

  const id = formData.get("id") as string;
  const fullName = formData.get("fullName") as string;
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;

  const adminClient = supabaseAdmin;
  const supabase = userRole.role === "super_admin" ? adminClient : await createClient();

  // 0. Check for expired subscription
  const subStatus = await checkActiveSubscription(userRole.storeId);
  if (!subStatus.active) return { error: subStatus.error };

  // RLS check: Can this admin see this user?
  const { data: targetUser } = await supabase
    .from("users")
    .select("id, store_id")
    .eq("id", id)
    .single();

  if (!targetUser) {
    return { error: "Unauthorized or user not found" };
  }

  // Safety check for super_admin: Ensure they are editing a user in the store they are impersonating
  if (userRole.role === "super_admin" && targetUser.store_id !== userRole.storeId) {
    return { error: "Impersonation mismatch: User does not belong to the active store." };
  }

  // Update public.users
  const { error: dbError } = await adminClient
    .from("users")
    .update({ full_name: fullName, username })
    .eq("id", id);

  if (dbError) {
    return { error: dbError.message };
  }

  // If password is provided, update it via Auth Admin
  if (password && password.trim().length >= 6) {
    const { error: authError } = await adminClient.auth.admin.updateUserById(id, {
      password: password.trim(),
    });
    if (authError) {
      return { error: `User updated, but password failed to update: ${authError.message}` };
    }
  }

  revalidatePath(`/${storeSlug}/admin/staff`);
  return { success: true };
}

export async function toggleManagerStatus(storeSlug: string, id: string, isActive: boolean) {
  const userRole = await requireRole(["admin", "super_admin"]);
  const supabase = userRole.role === "super_admin" ? supabaseAdmin : await createClient();

  // 0. Check for expired subscription
  const subStatus = await checkActiveSubscription(userRole.storeId);
  if (!subStatus.active) return { error: subStatus.error };

  const { error } = await supabase
    .from("users")
    .update({ is_active: isActive })
    .eq("id", id)
    .eq("store_id", userRole.storeId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/${storeSlug}/admin/staff`);
  return { success: true };
}

export async function deleteManager(storeSlug: string, id: string) {
  const userRole = await requireRole(["admin", "super_admin"]);
  
  const adminClient = supabaseAdmin;
  const supabase = userRole.role === "super_admin" ? adminClient : await createClient();

  // 0. Check for expired subscription
  const subStatus = await checkActiveSubscription(userRole.storeId);
  if (!subStatus.active) return { error: subStatus.error };

  // Verify ownership via RLS
  const { data: targetUser } = await supabase
    .from("users")
    .select("id, store_id")
    .eq("id", id)
    .single();

  if (!targetUser) {
    return { error: "Unauthorized or user not found" };
  }

  // Safety check for super_admin
  if (userRole.role === "super_admin" && targetUser.store_id !== userRole.storeId) {
    return { error: "Impersonation mismatch: User does not belong to the active store." };
  }

  // Delete from public.users (Auth deletion cascade isn't guaranteed depending on setup, do auth first)
  const { error: authError } = await adminClient.auth.admin.deleteUser(id);
  
  if (authError) {
    return { error: authError.message };
  }

  // Delete from users table is typically handled via cascade if set up, but we can double check
  // The SQL schema has: id uuid PRIMARY KEY -- Maps to auth.users.id
  // Usually it cascades, but just in case:
  await adminClient.from("users").delete().eq("id", id);

  revalidatePath(`/${storeSlug}/admin/staff`);
  return { success: true };
}
