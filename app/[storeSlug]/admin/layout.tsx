import { requireRole } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { redirect } from "next/navigation";
import { signOut } from "@/app/actions/auth";
import { PackageSearch, Users, LayoutDashboard, FileText, LogOut, CreditCard, Activity } from "lucide-react";
import UnifiedSidebar from "@/components/layout/UnifiedSidebar";
import MobileFooterNav from "@/components/layout/MobileFooterNav";
import BillingBanner from "@/components/layout/BillingBanner";
import Header from "@/components/layout/Header";
import MobileThemeToggle from "@/components/layout/MobileThemeToggle";
import { getSubscriptionData } from "@/app/actions/billing";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;
  const userRole = await requireRole(["admin", "super_admin"]);

  const supabase = supabaseAdmin;

  // Validate that this store belongs to this admin (bypassing RLS for validation)
  const { data: store, error } = await supabase
    .from("stores")
    .select("id, name, slug, plan, is_billing_exempt")
    .eq("slug", storeSlug)
    .single();

  if (error || !store) {
    redirect("/login");
  }

  if (userRole.role !== "super_admin" && store.id !== userRole.storeId) {
    redirect("/login");
  }

  // Fetch subscription metadata using unified plan enforcement system
  const { getStoreSubscriptionStatus } = require("@/lib/planEnforcement");
  const subStatus = await getStoreSubscriptionStatus(store.id);
  
  if (subStatus.isExpired) {
    const LockoutClient = require("@/components/admin/LockoutClient").default;
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

  // Sidebar link items
  const navItems = [
    { name: "Dashboard", href: `/${storeSlug}/admin/dashboard`, icon: "LayoutDashboard" },
    { name: "Products & Stock", href: `/${storeSlug}/admin/products`, icon: "PackageSearch" },
    { name: "Settings", href: `/${storeSlug}/admin/settings`, icon: "Settings" },
  ];

  const TrialBanner = require("@/components/layout/TrialBanner").default;

  return (
    <div className="flex h-[100dvh] bg-white dark:bg-[#0A0A0A] overflow-hidden text-gray-900 dark:text-gray-100">
      <UnifiedSidebar 
        storeName={store.name}
        roleLabel="Admin"
        navItems={navItems}
        signOutAction={signOut}
        accentColor="bg-[#00A9B0]"
        plan={store.plan}
        isExempt={store.is_billing_exempt}
        userName={userRole.full_name || "Admin"}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0 flex flex-col">
        {/* Mobile Header (minimal for now) */}
        <div className="md:hidden h-14 bg-gray-50 dark:bg-[#111111] border-b border-gray-200 dark:border-[#2C2C2E] flex items-center px-4 justify-between shrink-0">
           <span className="font-semibold truncate">{store.name} - Admin</span>
           <div className="flex items-center gap-1">
             <MobileThemeToggle />
             <form action={signOut}>
              <button type="submit" className="text-gray-500 hover:text-red-500 p-2">
                <LogOut className="w-5 h-5" />
              </button>
             </form>
           </div>
        </div>
        
        <div className="flex-1 lg:p-0">
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

      <MobileFooterNav navItems={navItems} accentColor="text-[#00A9B0]" />
    </div>
  );
}
