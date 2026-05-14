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
  ChevronRight,
} from "lucide-react";

const navItems = [
  { href: "/dashboard",  label: "Dashboard",     icon: LayoutDashboard },
  { href: "/clients",    label: "Clients",        icon: Users },
  { href: "/proposals",  label: "Proposals",      icon: FileText },
  { href: "/accounts",   label: "Accounts",       icon: Building2 },
  { href: "/marketplace",label: "Marketplace",    icon: Store },
  { href: "/leads",      label: "Leads",          icon: TrendingUp },
  { href: "/reports",    label: "Reports",        icon: BarChart3 },
  { href: "/meetings",   label: "Meeting Center", icon: CalendarDays },
];

const adminItems = [
  { href: "/admin/users", label: "Manage Users", icon: Settings },
];

const superAdminItems = [
  { href: "/super-admin/users", label: "All Users", icon: ShieldCheck },
];

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  USER: "Member",
};

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: "bg-violet-100 text-violet-700",
  ADMIN: "bg-indigo-100 text-indigo-700",
  USER: "bg-gray-100 text-gray-600",
};

function NavLink({ href, label, icon: Icon }: { href: string; label: string; icon: React.ElementType }) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      href={href}
      className={cn(
        "group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
        active
          ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-200/60"
          : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
      )}
    >
      <Icon className={cn("w-[17px] h-[17px] shrink-0", active ? "text-white" : "text-slate-400 group-hover:text-slate-600")} />
      <span className="truncate">{label}</span>
      {active && <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-70" />}
    </Link>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.12em] px-3 pt-5 pb-1.5">
      {label}
    </p>
  );
}

export function Sidebar() {
  const { data: session } = useSession();
  const role = (session?.user as { role?: string })?.role ?? "USER";
  const name = session?.user?.name ?? "User";
  const initial = name[0]?.toUpperCase() ?? "U";

  return (
    <aside className="flex flex-col w-[260px] min-h-screen bg-white border-r border-[#E2E8F0] shrink-0">

      {/* Brand */}
      <div className="flex items-center gap-3 px-5 pt-6 pb-5">
        <div className="relative w-9 h-9 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-md shadow-violet-300/50">
            <span className="text-white font-bold text-[15px] tracking-tight">N</span>
          </div>
        </div>
        <div className="min-w-0">
          <p className="text-[14px] font-bold text-slate-900 leading-tight tracking-tight">Nebs BD OS</p>
          <p className="text-[11px] text-slate-400 font-medium truncate">Business Dev Portal</p>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-4 h-px bg-slate-100 mb-2" />

      {/* Navigation */}
      <nav className="flex-1 px-3 overflow-y-auto pb-2">
        <SectionLabel label="Main Menu" />
        <div className="space-y-0.5">
          {navItems.map((item) => <NavLink key={item.href} {...item} />)}
        </div>

        {(role === "ADMIN" || role === "SUPER_ADMIN") && (
          <>
            <SectionLabel label="Admin" />
            <div className="space-y-0.5">
              {adminItems.map((item) => <NavLink key={item.href} {...item} />)}
            </div>
          </>
        )}

        {role === "SUPER_ADMIN" && (
          <>
            <SectionLabel label="Super Admin" />
            <div className="space-y-0.5">
              {superAdminItems.map((item) => <NavLink key={item.href} {...item} />)}
            </div>
          </>
        )}
      </nav>

      {/* User card */}
      <div className="px-3 pb-4 pt-2">
        <div className="mx-px h-px bg-slate-100 mb-3" />
        <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-gradient-to-br from-slate-50 to-violet-50/40 border border-slate-100">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
              {initial}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-slate-800 truncate leading-tight">{name}</p>
            <span className={cn("inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-md mt-0.5", ROLE_COLORS[role])}>
              {ROLE_LABELS[role]}
            </span>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-2.5 px-3 py-2.5 mt-1 w-full rounded-xl text-[13px] font-medium text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
