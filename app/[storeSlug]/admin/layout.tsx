import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { signOut } from "@/app/actions/auth";
import { PackageSearch, Users, LayoutDashboard, FileText, Settings, LogOut } from "lucide-react";

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
    // Attempting to access someone else's store
    redirect("/login");
  }

  // Sidebar link items
  const navItems = [
    { name: "Dashboard", href: `/${storeSlug}/admin/dashboard`, icon: LayoutDashboard },
    { name: "Products & Stock", href: `/${storeSlug}/admin/products`, icon: PackageSearch },
    { name: "Staff", href: `/${storeSlug}/admin/staff`, icon: Users },
    { name: "Reports", href: `/${storeSlug}/admin/reports`, icon: FileText },
  ];

  return (
    <div className="flex h-[100dvh] bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 flex flex-col hidden md:flex border-r border-slate-800">
        <div className="h-14 flex items-center px-4 border-b border-slate-800 text-white gap-2">
          <div className="h-6 w-6 text-slate-900 bg-white rounded flex items-center justify-center font-bold italic text-xs">f</div>
          <span className="font-semibold truncate">{store.name}</span>
          <span className="ml-auto text-xs bg-blue-600 px-1.5 py-0.5 rounded text-blue-50">Admin</span>
        </div>
        
        <div className="flex-1 py-4 flex flex-col gap-1 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <Icon className="w-4 h-4" />
                {item.name}
              </Link>
            );
          })}
        </div>

        <div className="p-4 border-t border-slate-800">
          <form action={signOut}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Mobile Header (minimal for now) */}
        <div className="md:hidden h-14 bg-slate-900 border-b border-slate-800 flex items-center px-4 text-white justify-between">
           <span className="font-semibold truncate">{store.name} - Admin</span>
           <form action={signOut}>
            <button type="submit" className="text-slate-400 p-2">
              <LogOut className="w-5 h-5" />
            </button>
          </form>
        </div>
        
        {children}
      </main>
    </div>
  );
}
