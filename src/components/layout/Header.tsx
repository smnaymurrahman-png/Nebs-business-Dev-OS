"use client";

import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  LayoutDashboard, Users, FileText, Building2, Store,
  TrendingUp, BarChart3, CalendarDays, Settings, ShieldCheck, Menu,
} from "lucide-react";

const pages: Record<string, { title: string; subtitle: string; icon: React.ElementType }> = {
  "/dashboard":         { title: "Dashboard",      subtitle: "Your business at a glance",       icon: LayoutDashboard },
  "/clients":           { title: "Clients",         subtitle: "Manage your client relationships", icon: Users },
  "/proposals":         { title: "Proposals",       subtitle: "Track proposals and deals",        icon: FileText },
  "/accounts":          { title: "Accounts",        subtitle: "Platform accounts & credentials",  icon: Building2 },
  "/marketplace":       { title: "Marketplace",     subtitle: "Marketplace profile listings",     icon: Store },
  "/leads":             { title: "Leads",           subtitle: "Manage and follow up on leads",    icon: TrendingUp },
  "/reports":           { title: "Reports",         subtitle: "Ad campaign performance",          icon: BarChart3 },
  "/meetings":          { title: "Meeting Center",  subtitle: "Schedule and manage meetings",     icon: CalendarDays },
  "/admin/users":       { title: "Manage Users",    subtitle: "Create and manage team members",   icon: Settings },
  "/super-admin/users": { title: "All Users",       subtitle: "System-wide user management",      icon: ShieldCheck },
};

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const name = session?.user?.name ?? "User";
  const initial = name[0]?.toUpperCase() ?? "U";

  const page =
    Object.entries(pages).find(([path]) => pathname.startsWith(path))?.[1] ??
    pages["/dashboard"];

  const Icon = page.icon;

  return (
    <header className="h-[56px] bg-white border-b border-gray-200 flex items-center px-4 sm:px-6 gap-3 shrink-0">
      {/* Hamburger — mobile only */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors shrink-0"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Page identity */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
          <Icon className="w-3.5 h-3.5 text-blue-600" />
        </div>
        <div className="min-w-0">
          <h1 className="text-[13px] font-semibold text-gray-900 leading-tight truncate">{page.title}</h1>
          <p className="text-[11px] text-gray-400 leading-tight hidden sm:block">{page.subtitle}</p>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2 shrink-0">
        {/* Live indicator */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px] font-semibold text-emerald-600">Live</span>
        </div>

        {/* User avatar */}
        <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
          {initial}
        </div>
      </div>
    </header>
  );
}
