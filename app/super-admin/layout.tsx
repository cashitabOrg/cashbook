import { signOut } from "@/app/actions/auth";
import { LayoutDashboard, Store, Users, CreditCard, LogOut, ShieldAlert } from "lucide-react";
import { requireRole } from "@/lib/auth";
import Link from "next/link";

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole(["super_admin"]);

  const navItems = [
    { name: "Dashboard", href: `/super-admin/dashboard`, icon: LayoutDashboard },
    { name: "Users", href: `/super-admin/users`, icon: Users },
    { name: "Plans", href: `/super-admin/plans`, icon: CreditCard },
  ];

  return (
    <div className="flex h-[100dvh] bg-slate-100">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 flex flex-col hidden md:flex border-r border-slate-950 shadow-xl z-10">
        <div className="h-14 flex items-center px-4 border-b border-slate-800 text-white gap-2 mt-4 pb-4">
          <div className="h-8 w-8 text-black bg-yellow-400 rounded-lg flex items-center justify-center font-bold">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg leading-tight tracking-tight uppercase">System</span>
            <span className="text-xs text-slate-400 uppercase tracking-widest">Platform Core</span>
          </div>
        </div>
        
        <div className="flex-1 py-6 flex flex-col gap-2 px-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-md text-slate-300 hover:text-white hover:bg-slate-800 transition-all hover:scale-[1.02]"
              >
                <Icon className="w-4 h-4" />
                {item.name}
              </Link>
            );
          })}
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-950/50">
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
      <main className="flex-1 overflow-y-auto w-full">
        {/* Mobile Header */}
        <div className="md:hidden h-14 shrink-0 bg-slate-900 border-b border-slate-800 flex items-center px-4 text-white justify-between shadow-md">
           <div className="flex items-center gap-2">
             <ShieldAlert className="w-5 h-5 text-yellow-400" />
             <span className="font-bold tracking-wider uppercase text-sm">System Core</span>
           </div>
           <form action={signOut}>
            <button type="submit" className="text-slate-400 hover:text-white transition-colors p-2">
              <LogOut className="w-5 h-5" />
            </button>
          </form>
        </div>
        
        <div className="mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
