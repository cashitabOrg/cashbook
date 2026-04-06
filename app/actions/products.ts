"use server";

import { createClient } from "@/lib/supabase-server";
import { requireRole } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function addProduct(storeSlug: string, formData: FormData) {
  const userRole = await requireRole(["admin", "super_admin"]);

  const name = formData.get("name") as string;
  const unit = formData.get("unit") as string;
  const minQuantity = formData.get("minQuantity") as string;
  const costPrice = formData.get("costPrice") as string;
  const sellingPrice = formData.get("sellingPrice") as string;

  const supabase = await createClient();

  const { error } = await supabase.from("products").insert({
    store_id: userRole.storeId,
    name,
    unit,
    min_quantity: Number(minQuantity) || 0,
    cost_price: Number(costPrice) || 0,
    selling_price: Number(sellingPrice) || 0,
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
  const costPrice = Number(formData.get("costPrice") || 0);
  const sellingPrice = Number(formData.get("sellingPrice") || 0);

  const supabase = await createClient();

  // 1. Fetch current product to check for price changes
  const { data: currentProduct } = await supabase
    .from("products")
    .select("cost_price, selling_price")
    .eq("id", id)
    .single();

  if (currentProduct) {
    const costChanged = Number(currentProduct.cost_price) !== costPrice;
    const sellingChanged = Number(currentProduct.selling_price) !== sellingPrice;

    if (costChanged || sellingChanged) {
      // Log the price change
      await supabase.from("product_price_logs").insert({
        product_id: id,
        old_cost: currentProduct.cost_price,
        new_cost: costPrice,
        old_selling: currentProduct.selling_price,
        new_selling: sellingPrice,
        changed_by: userRole.id,
      });
    }
  }

  const { error } = await supabase
    .from("products")
    .update({
      name,
      unit,
      min_quantity: Number(minQuantity) || 0,
      cost_price: costPrice,
      selling_price: sellingPrice,
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
  const unitCost = Number(formData.get("unitCost") || 0);
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
      unit_cost: unitCost,
      admin_id: userRole.id,
      note,
    });

  if (logError) return { error: logError.message };

  // 3. Update products atomically via RPC to prevent race conditions
  const { error: updateError } = await supabase.rpc('increment_stock', { 
    product_id: id, 
    amount: quantityAdded 
  });

  if (updateError) return { error: updateError.message };

  revalidatePath(`/${storeSlug}/admin/products`);
  return { success: true };
}

export async function getPriceHistory(productId: string) {
  const userRole = await requireRole(["admin", "super_admin"]);
  const supabase = await createClient();

  // 1. Fetch Price Changes
  const { data: priceLogs } = await supabase
    .from("product_price_logs")
    .select("*, users!changed_by(full_name)")
    .eq("product_id", productId)
    .order("created_at", { ascending: false });

  // 2. Fetch Restock History (Stock In)
  const { data: restockLogs } = await supabase
    .from("stock_additions")
    .select("*, users!admin_id(full_name)")
    .eq("product_id", productId)
    .order("created_at", { ascending: false });

  // 3. Fetch Adjustment Logs (Spoilage, Damage, etc)
  const { data: adjustmentLogs } = await supabase
    .from("stock_adjustments")
    .select("*, users!admin_id(full_name)")
    .eq("product_id", productId)
    .order("created_at", { ascending: false });

  return {
    priceLogs: priceLogs || [],
    restockLogs: restockLogs || [],
    adjustmentLogs: adjustmentLogs || [],
  };
}

export async function adjustStock(storeSlug: string, formData: FormData) {
  const userRole = await requireRole(["admin", "super_admin"]);

  const productId = formData.get("product_id") as string;
  const quantityChange = Number(formData.get("quantityChange"));
  const reason = formData.get("reason") as string;
  const note = formData.get("note") as string;

  if (isNaN(quantityChange) || quantityChange === 0) {
    return { error: "Adjustment quantity must be a non-zero number." };
  }

  const supabase = await createClient();

  // 1. Get current quantity
  const { data: product, error: findError } = await supabase
    .from("products")
    .select("quantity")
    .eq("id", productId)
    .single();

  if (findError || !product) {
    return { error: "Product not found." };
  }

  // 2. Record Adjustment
  const { error: logError } = await supabase.from("stock_adjustments").insert({
    store_id: userRole.storeId,
    product_id: productId,
    admin_id: userRole.id,
    quantity_change: quantityChange,
    reason,
    note,
  });

  if (logError) return { error: logError.message };

  // 3. Update products atomically via RPC to prevent race conditions
  const { error: updateError } = await supabase.rpc('increment_stock', { 
    product_id: productId, 
    amount: quantityChange 
  });

  if (updateError) return { error: updateError.message };

  revalidatePath(`/${storeSlug}/admin/products`);
  return { success: true };
}
