"use client";

import { usePathname } from "next/navigation";

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  "/dashboard":       { title: "Dashboard",           subtitle: "Welcome back! Here's what's happening." },
  "/clients":         { title: "Clients",              subtitle: "Manage your client relationships." },
  "/proposals":       { title: "Proposals",            subtitle: "Track all your proposals and deals." },
  "/accounts":        { title: "Accounts",             subtitle: "Platform accounts and credentials." },
  "/marketplace":     { title: "Marketplace",          subtitle: "Your marketplace profile listings." },
  "/leads":           { title: "Leads",                subtitle: "Manage and follow up on leads." },
  "/reports":         { title: "Reports",              subtitle: "Ad campaign performance reports." },
  "/meetings":        { title: "Meeting Center",       subtitle: "Schedule and manage meetings." },
  "/admin/users":     { title: "Manage Users",         subtitle: "Create and manage team members." },
  "/super-admin/users": { title: "All Users",          subtitle: "System-wide user management." },
};

export function Header() {
  const pathname = usePathname();
  const page =
    Object.entries(pageTitles).find(([path]) => pathname.startsWith(path))?.[1] ??
    pageTitles["/dashboard"];

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center px-6 gap-4 shadow-sm">
      <div>
        <h1 className="text-base font-semibold text-gray-900 leading-tight">{page.title}</h1>
        <p className="text-xs text-gray-400 font-medium">{page.subtitle}</p>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-xs text-gray-400 font-medium">Live</span>
      </div>
    </header>
  );
}
