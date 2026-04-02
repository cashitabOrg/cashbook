import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { signOut } from "@/app/actions/auth";
import { PackageSearch, Users, LayoutDashboard, FileText, LogOut } from "lucide-react";
import UnifiedSidebar from "@/components/layout/UnifiedSidebar";
import MobileFooterNav from "@/components/layout/MobileFooterNav";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { storeSlug: string };
}) {
  const { storeSlug } = await params;
  const userRole = await requireRole(["admin", "super_admin"]);

  const supabase = await createClient();

  // Validate that this store belongs to this admin
  const { data: store, error } = await supabase
    .from("stores")
    .select("id, name, slug")
    .eq("slug", storeSlug)
    .single();

  if (error || !store) {
    redirect("/login");
  }

  // Strict tenant isolation check (unless super_admin)
  if (userRole.role !== "super_admin" && store.id !== userRole.storeId) {
    redirect("/login");
  }

  // Sidebar link items
  const navItems = [
    { name: "Dashboard", href: `/${storeSlug}/admin/dashboard`, icon: "LayoutDashboard" },
    { name: "Products & Stock", href: `/${storeSlug}/admin/products`, icon: "PackageSearch" },
    { name: "Staff", href: `/${storeSlug}/admin/staff`, icon: "Users" },
    { name: "Reports", href: `/${storeSlug}/admin/reports`, icon: "FileText" },
  ];

  return (
    <div className="flex h-[100dvh] bg-gray-50 overflow-hidden">
      <UnifiedSidebar 
        storeName={store.name}
        roleLabel="Admin"
        navItems={navItems}
        signOutAction={signOut}
        accentColor="bg-blue-600"
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
          {children}
        </div>
      </main>

      <MobileFooterNav navItems={navItems} accentColor="text-blue-500" />
    </div>
  );
}
