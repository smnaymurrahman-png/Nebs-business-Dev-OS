"use client";

import { usePathname } from "next/navigation";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/clients": "Clients",
  "/proposals": "Proposals",
  "/accounts": "Accounts",
  "/marketplace": "Marketplace Profiles",
  "/leads": "Leads",
  "/reports": "Reports",
  "/meetings": "Meeting Center",
  "/admin/users": "Manage Users",
  "/super-admin/users": "All Users",
};

export function Header() {
  const pathname = usePathname();
  const title =
    Object.entries(pageTitles).find(([path]) => pathname.startsWith(path))?.[1] ??
    "Dashboard";

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center px-6">
      <h1 className="text-lg font-semibold text-gray-800">{title}</h1>
    </header>
  );
}
