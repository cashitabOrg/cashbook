"use server";

import { cookies } from "next/headers";
import { getUserRole } from "@/lib/auth";

export async function startImpersonation(storeId: string) {
  const role = await getUserRole();
  if (role !== "super_admin") {
    return { error: "Unauthorized" };
  }

  const cookieStore = await cookies();
  cookieStore.set("impersonate_store_id", storeId, {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 3600 // 1 hour
  });

  return { success: true };
}

export async function stopImpersonation() {
  const role = await getUserRole();
  if (role !== "super_admin") {
    return { error: "Unauthorized" };
  }

  const cookieStore = await cookies();
  cookieStore.delete("impersonate_store_id");

  return { success: true };
}
