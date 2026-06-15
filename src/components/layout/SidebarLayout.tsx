"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

export function SidebarLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-gray-900/40 backdrop-blur-[2px] lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <Sidebar isOpen={open} onClose={() => setOpen(false)} />

      <div className="flex flex-col flex-1 overflow-hidden min-w-0 w-full">
        <Header onMenuClick={() => setOpen(true)} />
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6 bg-transparent">
          {children}
        </main>
      </div>
    </div>
  );
}
