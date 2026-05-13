"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  FileText,
  Building2,
  Store,
  TrendingUp,
  BarChart3,
  CalendarDays,
  LogOut,
  Settings,
  ShieldCheck,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/proposals", label: "Proposals", icon: FileText },
  { href: "/accounts", label: "Accounts", icon: Building2 },
  { href: "/marketplace", label: "Marketplace", icon: Store },
  { href: "/leads", label: "Leads", icon: TrendingUp },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/meetings", label: "Meeting Center", icon: CalendarDays },
];

const adminItems = [
  { href: "/admin/users", label: "Manage Users", icon: Settings },
];

const superAdminItems = [
  { href: "/super-admin/users", label: "All Users", icon: ShieldCheck },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = (session?.user as { role?: string })?.role;

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <div className="flex flex-col w-64 min-h-screen bg-white border-r border-gray-100 shadow-sm">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-100">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-md shadow-violet-200">
          <span className="text-white font-bold text-sm">N</span>
        </div>
        <div>
          <p className="text-sm font-700 font-semibold text-gray-900 leading-tight">Nebs BD OS</p>
          <p className="text-[11px] text-violet-500 font-medium">Business Dev Portal</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-3 mb-2">Main Menu</p>
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
              isActive(href)
                ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-200"
                : "text-gray-500 hover:bg-violet-50 hover:text-violet-700"
            )}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </Link>
        ))}

        {(role === "ADMIN" || role === "SUPER_ADMIN") && (
          <>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-3 pt-4 mb-2">Admin</p>
            {adminItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                  isActive(href)
                    ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-200"
                    : "text-gray-500 hover:bg-violet-50 hover:text-violet-700"
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </Link>
            ))}
          </>
        )}

        {role === "SUPER_ADMIN" && (
          <>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-3 pt-4 mb-2">Super Admin</p>
            {superAdminItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                  isActive(href)
                    ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-200"
                    : "text-gray-500 hover:bg-violet-50 hover:text-violet-700"
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </Link>
            ))}
          </>
        )}
      </nav>

      {/* User footer */}
      <div className="px-3 py-4 border-t border-gray-100">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-violet-50 mb-1">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-xs font-bold text-white shadow-sm shadow-violet-200 shrink-0">
            {session?.user?.name?.[0]?.toUpperCase() ?? "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate">{session?.user?.name}</p>
            <p className="text-[11px] text-violet-500 font-medium truncate">{role}</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all duration-150"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
