import AdminProductsClient from "@/components/admin/AdminProductsClient";
import { requireRole } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;
  const userRole = await requireRole(["admin", "super_admin"]);
  const supabase = supabaseAdmin;

  // 1. Fetch store plan with resilience
  let store: any = null;
  let products: any[] | null = null;
  let error: any = null;
  
  // Retry helper
  const tryFetch = async (fn: () => PromiseLike<any> | any, maxAttempts = 2) => {
    for (let i = 0; i < maxAttempts; i++) {
       const res = await fn();
       if (!res.error) return res;
       if (res.error.message?.includes('fetch failed')) {
         await new Promise(r => setTimeout(r, 200 * (i + 1)));
         continue;
       }
       return res;
    }
    return { data: null, error: new Error('Network failure after retries') };
  };

  const storeRes = await tryFetch(() => supabase
    .from("stores")
    .select("plan, is_billing_exempt")
    .eq("id", userRole.storeId)
    .single());
  store = storeRes.data;

  // 2. Fetch products exclusively for this store
  const prodRes = await tryFetch(() => supabase
    .from("products")
    .select("*")
    .eq("store_id", userRole.storeId)
    .order("name"));
  products = prodRes.data;
  error = prodRes.error;

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 text-red-700 p-4 rounded-md">
          Failed to load products: {error.message}
        </div>
      </div>
    );
  }

  return (
    <AdminProductsClient 
      storeSlug={storeSlug} 
      products={products || []} 
      plan={store?.plan || 'free'}
      isExempt={store?.is_billing_exempt || false}
    />
  );
}
