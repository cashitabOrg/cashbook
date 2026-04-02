"use server";

import { createClient } from "@/lib/supabase-server";
import { requireRole } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function addProduct(storeSlug: string, formData: FormData) {
  const userRole = await requireRole(["admin", "super_admin"]);

  const name = formData.get("name") as string;
  const unit = formData.get("unit") as string;
  const minQuantity = formData.get("minQuantity") as string;

  const supabase = await createClient();

  const { error } = await supabase.from("products").insert({
    store_id: userRole.storeId,
    name,
    unit,
    min_quantity: Number(minQuantity) || 0,
    quantity: 0,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/${storeSlug}/admin/products`);
  return { success: true };
}

export async function editProduct(storeSlug: string, formData: FormData) {
  const userRole = await requireRole(["admin", "super_admin"]);

  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const unit = formData.get("unit") as string;
  const minQuantity = formData.get("minQuantity") as string;

  const supabase = await createClient();

  const { error } = await supabase
    .from("products")
    .update({
      name,
      unit,
      min_quantity: Number(minQuantity) || 0,
    })
    .eq("id", id)
    .eq("store_id", userRole.storeId); // RLS failsafe

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/${storeSlug}/admin/products`);
  return { success: true };
}

export async function deleteProduct(storeSlug: string, formData: FormData) {
  const userRole = await requireRole(["admin", "super_admin"]);

  const id = formData.get("id") as string;

  const supabase = await createClient();

  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", id)
    .eq("store_id", userRole.storeId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/${storeSlug}/admin/products`);
  return { success: true };
}

export async function addStock(storeSlug: string, formData: FormData) {
  const userRole = await requireRole(["admin", "super_admin"]);

  const id = formData.get("product_id") as string;
  const quantityAdded = Number(formData.get("quantityAdded"));
  const note = formData.get("note") as string;

  if (quantityAdded <= 0) {
    return { error: "Quantity added must be greater than 0" };
  }

  const supabase = await createClient();

  // Next.js actions don't wrap in PG transaction natively without raw SQL,
  // but we can execute sequential queries or use a custom RPC.
  // For standard Supabase setups, best way is RPC or sequential here if RLS blocks RPC.
  // Let's do sequential for now.
  
  // 1. Get current product qty
  const { data: product, error: findError } = await supabase
    .from('products')
    .select('quantity')
    .eq('id', id)
    .single();

  if (findError || !product) {
    return { error: "Failed to locate product." };
  }

  // 2. Insert stock_additions log
  const { error: logError } = await supabase
    .from('stock_additions')
    .insert({
      store_id: userRole.storeId,
      product_id: id,
      quantity_added: quantityAdded,
      admin_id: userRole.id,
      note,
    });

  if (logError) return { error: logError.message };

  // 3. Update products
  const newQuantity = Number(product.quantity) + quantityAdded;
  const { error: updateError } = await supabase
    .from('products')
    .update({ quantity: newQuantity })
    .eq('id', id);

  if (updateError) return { error: updateError.message };

  revalidatePath(`/${storeSlug}/admin/products`);
  return { success: true };
}
