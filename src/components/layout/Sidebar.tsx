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
  { href: "/dashboard",   label: "Dashboard",      icon: LayoutDashboard },
  { href: "/clients",     label: "Clients",         icon: Users },
  { href: "/proposals",   label: "Proposals",       icon: FileText },
  { href: "/accounts",    label: "Accounts",        icon: Building2 },
  { href: "/marketplace", label: "Marketplace",     icon: Store },
  { href: "/leads",       label: "Leads",           icon: TrendingUp },
  { href: "/reports",     label: "Reports",         icon: BarChart3 },
  { href: "/meetings",    label: "Meeting Center",  icon: CalendarDays },
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
  SUPER_ADMIN: "bg-blue-100 text-blue-700",
  ADMIN: "bg-sky-100 text-sky-700",
  USER: "bg-gray-100 text-gray-600",
};

function NavLink({
  href,
  label,
  icon: Icon,
  onClose,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  onClose?: () => void;
}) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      href={href}
      onClick={onClose}
      className={cn(
        "group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150",
        active
          ? "bg-blue-600 text-white"
          : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"
      )}
    >
      <Icon className={cn("w-4 h-4 shrink-0", active ? "text-white" : "text-gray-400 group-hover:text-gray-600")} />
      <span className="truncate">{label}</span>
      {active && <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-60" />}
    </Link>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.1em] px-3 pt-5 pb-1">
      {label}
    </p>
  );
}

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { data: session } = useSession();
  const role = (session?.user as { role?: string })?.role ?? "USER";
  const name = session?.user?.name ?? "User";
  const initial = name[0]?.toUpperCase() ?? "U";

  return (
    <aside
      className={cn(
        "flex flex-col w-[240px] min-h-screen bg-white border-r border-gray-200 shrink-0 z-50 transition-transform duration-300 ease-in-out",
        "fixed inset-y-0 left-0",
        isOpen ? "translate-x-0" : "-translate-x-full",
        "lg:relative lg:translate-x-0"
      )}
    >
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-4 pt-5 pb-4">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
          <span className="text-white font-bold text-[14px]">N</span>
        </div>
        <div className="min-w-0">
          <p className="text-[13px] font-bold text-gray-900 leading-tight">Nebs BD OS</p>
          <p className="text-[11px] text-gray-400 truncate">Business Dev Portal</p>
        </div>
      </div>

      <div className="mx-4 h-px bg-gray-100" />

      {/* Navigation */}
      <nav className="flex-1 px-3 overflow-y-auto py-2">
        <SectionLabel label="Main Menu" />
        <div className="space-y-0.5">
          {navItems.map((item) => <NavLink key={item.href} {...item} onClose={onClose} />)}
        </div>

        {(role === "ADMIN" || role === "SUPER_ADMIN") && (
          <>
            <SectionLabel label="Admin" />
            <div className="space-y-0.5">
              {adminItems.map((item) => <NavLink key={item.href} {...item} onClose={onClose} />)}
            </div>
          </>
        )}

        {role === "SUPER_ADMIN" && (
          <>
            <SectionLabel label="Super Admin" />
            <div className="space-y-0.5">
              {superAdminItems.map((item) => <NavLink key={item.href} {...item} onClose={onClose} />)}
            </div>
          </>
        )}
      </nav>

      {/* User card */}
      <div className="px-3 pb-4 pt-2">
        <div className="h-px bg-gray-100 mb-3" />
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gray-50 border border-gray-100">
          <div className="relative shrink-0">
            <div className="w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
              {initial}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full border-2 border-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold text-gray-800 truncate leading-tight">{name}</p>
            <span className={cn("inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded mt-0.5", ROLE_COLORS[role])}>
              {ROLE_LABELS[role]}
            </span>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-2 px-3 py-2 mt-1 w-full rounded-lg text-[12px] font-medium text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
