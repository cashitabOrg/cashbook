import { requireRole } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { redirect } from "next/navigation";
import { signOut } from "@/app/actions/auth";
import { LayoutDashboard, ShoppingCart, History, LogOut } from "lucide-react";
import UnifiedSidebar from "@/components/layout/UnifiedSidebar";
import MobileFooterNav from "@/components/layout/MobileFooterNav";
import BillingBanner from "@/components/layout/BillingBanner";
import MobileThemeToggle from "@/components/layout/MobileThemeToggle";
import { getSubscriptionData } from "@/app/actions/billing";
import { getStoreSubscriptionStatus } from "@/lib/planEnforcement";
import LockoutClient from "@/components/admin/LockoutClient";
import TrialBanner from "@/components/layout/TrialBanner";

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

  // Fetch subscription metadata using unified plan enforcement system
  const subStatus = await getStoreSubscriptionStatus(store.id);
  
  if (subStatus.isExpired) {
    return (
      <LockoutClient
        storeName={store.name}
        storeSlug={storeSlug}
        storeId={store.id}
        userEmail={userRole.email}
        expiredPlan={subStatus.plan}
        signOutAction={signOut}
      />
    );
  }

  const navItems = [
    { name: "Dashboard", href: `/${storeSlug}/manager/dashboard`, icon: "LayoutDashboard" },
    { name: "Sales Point", href: `/${storeSlug}/manager/sales`, icon: "ShoppingCart" },
    { name: "History", href: `/${storeSlug}/manager/history`, icon: "History" },
  ];

  return (
    <div className="flex h-[100dvh] bg-gray-50 dark:bg-[#0A0A0A] overflow-hidden text-gray-900 dark:text-gray-100">
      <UnifiedSidebar 
        storeName={store.name}
        roleLabel="POS"
        navItems={navItems}
        signOutAction={signOut}
        accentColor="bg-emerald-600"
        plan={store.plan}
        userName={userRole.full_name || "Manager"}
      />

      <main className="flex-1 flex flex-col overflow-hidden pb-20 md:pb-0">
        <div className="md:hidden h-14 shrink-0 bg-gray-50 dark:bg-[#111111] border-b border-gray-200 dark:border-[#2C2C2E] flex items-center px-4 text-gray-900 dark:text-white justify-between">
           <span className="font-semibold truncate">{store.name} - POS</span>
           <div className="flex items-center gap-1">
             <MobileThemeToggle />
             <form action={signOut}>
              <button type="submit" className="text-gray-500 hover:text-red-500 p-2">
                <LogOut className="w-5 h-5" />
              </button>
            </form>
           </div>
        </div>
        
        <div className="flex-1 overflow-y-auto lg:p-0">
          {subStatus.isTrial && (
            <TrialBanner 
              storeSlug={storeSlug} 
              daysRemaining={subStatus.trialDaysLeft} 
            />
          )}
          
          <BillingBanner 
            storeSlug={storeSlug}
            plan={store.plan}
            daysRemaining={subStatus.expiryDate ? Math.ceil((new Date(subStatus.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null}
            isExempt={store.is_billing_exempt}
          />
          {children}
        </div>
      </main>

      <MobileFooterNav navItems={navItems} accentColor="text-emerald-500" />
    </div>
  );
}
