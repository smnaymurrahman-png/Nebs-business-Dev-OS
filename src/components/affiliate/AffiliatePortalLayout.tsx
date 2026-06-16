"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { AffiliateSidebar } from "./AffiliateSidebar";
import type { AffiliateSession } from "@/lib/affiliate-auth";

export function AffiliatePortalLayout({
  session,
  children,
}: {
  session: AffiliateSession;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      <AffiliateSidebar
        name={session.name}
        email={session.email}
        code={session.code}
        isOpen={open}
        onClose={() => setOpen(false)}
      />

      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200">
          <button onClick={() => setOpen(true)} className="p-1.5 text-gray-500 hover:text-gray-800">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-violet-600 rounded flex items-center justify-center">
              <span className="text-white text-xs font-bold">N</span>
            </div>
            <span className="text-sm font-semibold text-gray-800">Affiliate Portal</span>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6 bg-[#F3F4F6]">
          {children}
        </main>
      </div>
    </div>
  );
}
