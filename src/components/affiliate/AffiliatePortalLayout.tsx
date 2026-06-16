"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Menu, Bell, X } from "lucide-react";
import { AffiliateSidebar } from "./AffiliateSidebar";
import type { AffiliateSession } from "@/lib/affiliate-auth";

interface Notification {
  id: string; type: string; payload: Record<string, unknown>;
  readAt: string | null; createdAt: string;
}

const NOTIF_LABEL: Record<string, string> = {
  NEW_OFFER:       "New offer available",
  LEAD_ACCEPTED:   "Your lead was accepted",
  LEAD_REJECTED:   "Your lead was not accepted",
  PAYOUT_APPROVED: "Payout approved",
  PAYOUT_PAID:     "Payout sent",
};

function NotificationBell() {
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const data = await fetch("/api/affiliate/notifications").then((r) => r.json());
    setNotifs(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const unread = notifs.filter((n) => !n.readAt).length;

  const handleOpen = async () => {
    setOpen((o) => !o);
    if (!open && unread > 0) {
      await fetch("/api/affiliate/notifications", { method: "PATCH" });
      setNotifs((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })));
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button onClick={handleOpen} className="relative p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors">
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-80 bg-white rounded-xl border border-gray-200 shadow-xl z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-700">Notifications</p>
            <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-gray-100 text-gray-400">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="max-h-72 overflow-y-auto">
            {notifs.length === 0 ? (
              <p className="px-4 py-6 text-sm text-gray-400 text-center">No notifications yet</p>
            ) : notifs.map((n) => (
              <div key={n.id} className="px-4 py-3 border-b border-gray-50 last:border-0">
                <p className="text-sm font-medium text-gray-800">{NOTIF_LABEL[n.type] ?? n.type}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">{new Date(n.createdAt).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

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
        {/* Top bar */}
        <div className="flex items-center justify-between gap-3 px-4 py-3 bg-white border-b border-gray-200">
          <div className="flex items-center gap-3 lg:hidden">
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
          <div className="hidden lg:block" />
          <NotificationBell />
        </div>

        <main className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6 bg-[#F3F4F6]">
          {children}
        </main>
      </div>
    </div>
  );
}
