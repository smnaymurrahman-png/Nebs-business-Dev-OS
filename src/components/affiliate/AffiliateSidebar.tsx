"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Star,
  Wallet,
  Settings,
  LogOut,
  ChevronRight,
  X,
} from "lucide-react";

const navItems = [
  { href: "/affiliate/dashboard", label: "Dashboard",   icon: LayoutDashboard },
  { href: "/affiliate/leads",     label: "My Leads",    icon: Users },
  { href: "/affiliate/meetings",  label: "Meetings",    icon: CalendarDays },
  { href: "/affiliate/onboarded", label: "Onboarded",   icon: Star },
  { href: "/affiliate/offers",    label: "Offers",      icon: Star },
  { href: "/affiliate/payouts",   label: "Payouts",     icon: Wallet },
  { href: "/affiliate/settings",  label: "Settings",    icon: Settings },
];

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
          ? "bg-violet-600 text-white"
          : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"
      )}
    >
      <Icon
        className={cn(
          "w-4 h-4 shrink-0",
          active ? "text-white" : "text-gray-400 group-hover:text-gray-600"
        )}
      />
      <span className="truncate">{label}</span>
      {active && <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-60" />}
    </Link>
  );
}

interface AffiliateSidebarProps {
  name: string;
  email: string;
  code: string;
  isOpen?: boolean;
  onClose?: () => void;
}

export function AffiliateSidebar({ name, email, code, isOpen, onClose }: AffiliateSidebarProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/affiliate/auth/logout", { method: "POST" });
    router.push("/affiliate/login");
    router.refresh();
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-5 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center shrink-0">
            <span className="text-white text-sm font-bold">N</span>
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-bold text-gray-900 truncate">Affiliate Portal</p>
            <p className="text-[10px] text-gray-400 font-mono">{code}</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="lg:hidden p-1 text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
        {navItems.map((item) => (
          <NavLink key={item.href} {...item} onClose={onClose} />
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-3 border-t border-gray-100 space-y-1">
        <div className="px-3 py-2">
          <p className="text-[13px] font-semibold text-gray-800 truncate">{name}</p>
          <p className="text-[11px] text-gray-400 truncate">{email}</p>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all"
        >
          <LogOut className="w-4 h-4 text-gray-400" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:flex w-56 shrink-0 flex-col h-screen sticky top-0">
        {sidebarContent}
      </div>

      {/* Mobile drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="absolute inset-0 bg-gray-900/40 backdrop-blur-[2px]"
            onClick={onClose}
          />
          <div className="relative w-56 shrink-0 flex flex-col h-full shadow-xl">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
