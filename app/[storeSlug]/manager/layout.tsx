import { requireRole } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { redirect } from "next/navigation";
import { signOut } from "@/app/actions/auth";
import { LayoutDashboard, ShoppingCart, History, LogOut } from "lucide-react";
import UnifiedSidebar from "@/components/layout/UnifiedSidebar";
import MobileFooterNav from "@/components/layout/MobileFooterNav";
import BillingBanner from "@/components/layout/BillingBanner";
import { getSubscriptionData } from "@/app/actions/billing";

export default async function ManagerLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;
  const userRole = await requireRole(["manager", "admin", "super_admin"]);

  const supabase = supabaseAdmin;

  // Validate store (bypassing RLS for validation)
  const { data: store, error } = await supabase
    .from("stores")
    .select("id, name, slug, plan, is_billing_exempt")
    .eq("slug", storeSlug)
    .single();

  if (error || !store) {
    redirect("/login");
  }

  // Isolation check
  if (userRole.role !== "super_admin" && store.id !== userRole.storeId) {
    redirect("/login");
  }

  // Fetch subscription metadata
  const subscription = await getSubscriptionData(store.id);
  const expiryDate = subscription?.current_period_end ? new Date(subscription.current_period_end) : null;
  const daysRemaining = expiryDate ? Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;
  const isExpired = daysRemaining !== null && daysRemaining < 0;

  const navItems = [
    { name: "Dashboard", href: `/${storeSlug}/manager/dashboard`, icon: "LayoutDashboard" },
    { name: "Sales Point", href: `/${storeSlug}/manager/sales`, icon: "ShoppingCart" },
    { name: "History", href: `/${storeSlug}/manager/history`, icon: "History" },
  ];

  return (
    <div className="flex h-[100dvh] bg-gray-50 overflow-hidden">
      <UnifiedSidebar 
        storeName={store.name}
        roleLabel="POS"
        navItems={navItems}
        signOutAction={signOut}
        accentColor="bg-emerald-600"
        plan={store.plan}
      />

      <main className="flex-1 flex flex-col overflow-hidden pb-20 md:pb-0">
        <div className="md:hidden h-14 shrink-0 bg-slate-900 border-b border-slate-800 flex items-center px-4 text-white justify-between">
           <span className="font-semibold truncate">{store.name} - POS</span>
           <form action={signOut}>
            <button type="submit" className="text-slate-400 p-2">
              <LogOut className="w-5 h-5" />
            </button>
          </form>
        </div>
        
        <div className="flex-1 overflow-y-auto lg:p-0">
          <BillingBanner 
            storeSlug={storeSlug}
            plan={store.plan}
            daysRemaining={daysRemaining}
            isExempt={store.is_billing_exempt}
          />
          {children}
        </div>
      </main>

      <MobileFooterNav navItems={navItems} accentColor="text-emerald-500" />
    </div>
  );
}
