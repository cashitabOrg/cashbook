import { requireRole } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { redirect } from "next/navigation";
import { signOut } from "@/app/actions/auth";
import { PackageSearch, Users, LayoutDashboard, FileText, LogOut, CreditCard, Activity } from "lucide-react";
import UnifiedSidebar from "@/components/layout/UnifiedSidebar";
import MobileFooterNav from "@/components/layout/MobileFooterNav";
import BillingBanner from "@/components/layout/BillingBanner";
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

  // Fetch subscription metadata
  const subscription = await getSubscriptionData(store.id);
  const expiryDate = subscription?.current_period_end ? new Date(subscription.current_period_end) : null;
  const daysRemaining = expiryDate ? Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;
  const isExpired = daysRemaining !== null && daysRemaining < 0;

  // Sidebar link items
  const navItems = [
    { name: "Dashboard", href: `/${storeSlug}/admin/dashboard`, icon: "LayoutDashboard" },
    { name: "Products & Stock", href: `/${storeSlug}/admin/products`, icon: "PackageSearch" },
    { name: "Reports", href: `/${storeSlug}/admin/reports`, icon: "FileText" },
    { name: "Stock Movement", href: `/${storeSlug}/admin/ledger`, icon: "Activity" },
    { name: "Staff", href: `/${storeSlug}/admin/staff`, icon: "Users" },
    { name: "Billing", href: `/${storeSlug}/admin/billing`, icon: "CreditCard" },
  ];

  return (
    <div className="flex h-[100dvh] bg-gray-50 overflow-hidden">
      <UnifiedSidebar 
        storeName={store.name}
        roleLabel="Admin"
        navItems={navItems}
        signOutAction={signOut}
        accentColor="bg-blue-600"
        plan={store.plan}
        isExempt={store.is_billing_exempt}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
        {/* Mobile Header (minimal for now) */}
        <div className="md:hidden h-14 bg-slate-900 border-b border-slate-800 flex items-center px-4 text-white justify-between shrink-0">
           <span className="font-semibold truncate">{store.name} - Admin</span>
           <form action={signOut}>
            <button type="submit" className="text-slate-400 p-2">
              <LogOut className="w-5 h-5" />
            </button>
          </form>
        </div>
        
        <div className="lg:p-0">
          <BillingBanner 
            storeSlug={storeSlug}
            plan={store.plan}
            daysRemaining={daysRemaining}
            isExempt={store.is_billing_exempt}
          />
          {children}
        </div>
      </main>

      <MobileFooterNav navItems={navItems} accentColor="text-blue-500" />
    </div>
  );
}
