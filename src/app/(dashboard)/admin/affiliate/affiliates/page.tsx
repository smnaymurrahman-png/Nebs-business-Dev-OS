"use client";

import { useEffect, useState, useCallback } from "react";
import { Users, CheckCircle, PauseCircle, Ban, RotateCcw } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";

interface AffiliateStats {
  submitted: number; accepted: number; onboarded: number;
  commissionEarned: number; commissionPaid: number;
}
interface Affiliate {
  id: string; fullName: string; email: string; phone: string;
  affiliateCode: string; status: string; createdAt: string; approvedAt: string | null;
  approver: { name: string } | null; stats: AffiliateStats;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING:   "bg-amber-50 text-amber-700",
  ACTIVE:    "bg-emerald-50 text-emerald-700",
  SUSPENDED: "bg-orange-50 text-orange-600",
  BANNED:    "bg-red-50 text-red-600",
};

export default function AdminAffiliatesPage() {
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [acting, setActing] = useState<string | null>(null);
  const [filter, setFilter] = useState("ALL");

  const load = useCallback(async () => {
    const data = await fetch("/api/admin/affiliate/affiliates").then((r) => r.json());
    setAffiliates(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => { load(); }, [load]);

  const act = async (id: string, action: string) => {
    setActing(id + action);
    await fetch(`/api/admin/affiliate/affiliates/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setActing(null);
    load();
  };

  const statuses = ["ALL", "PENDING", "ACTIVE", "SUSPENDED", "BANNED"];
  const filtered = affiliates.filter((a) => filter === "ALL" || a.status === filter);

  const counts = {
    PENDING: affiliates.filter((a) => a.status === "PENDING").length,
    ACTIVE: affiliates.filter((a) => a.status === "ACTIVE").length,
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Affiliate Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">Approve, suspend, or ban affiliate accounts</p>
        </div>
        {counts.PENDING > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-100 rounded-lg">
            <span className="text-amber-700 text-xs font-semibold">{counts.PENDING} pending approval</span>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total Affiliates", value: affiliates.length, icon: Users, cls: "bg-blue-50 text-blue-600" },
          { label: "Active", value: counts.ACTIVE, icon: CheckCircle, cls: "bg-emerald-50 text-emerald-600" },
          { label: "Pending", value: counts.PENDING, icon: PauseCircle, cls: "bg-amber-50 text-amber-600" },
          { label: "Suspended/Banned", value: affiliates.filter((a) => ["SUSPENDED", "BANNED"].includes(a.status)).length, icon: Ban, cls: "bg-red-50 text-red-600" },
        ].map(({ label, value, icon: Icon, cls }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center mb-2", cls)}>
              <Icon className="w-4 h-4" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-400 font-medium mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit flex-wrap">
        {statuses.map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={cn("px-3 py-1.5 text-xs font-semibold rounded-md transition-colors", filter === s ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700")}>
            {s}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Affiliate", "Code", "Stats", "Status", "Joined", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-sm text-gray-400">No affiliates found</td></tr>
              ) : filtered.map((a) => (
                <tr key={a.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3.5">
                    <p className="text-sm font-semibold text-gray-800">{a.fullName}</p>
                    <p className="text-xs text-gray-400">{a.email}</p>
                    <p className="text-xs text-gray-400">{a.phone}</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="font-mono text-xs text-gray-600">{a.affiliateCode}</p>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-gray-500 space-y-0.5">
                    <p>Leads: <span className="font-semibold text-gray-700">{a.stats.submitted}</span></p>
                    <p>Accepted: <span className="font-semibold text-gray-700">{a.stats.accepted}</span></p>
                    <p>Onboarded: <span className="font-semibold text-gray-700">{a.stats.onboarded}</span></p>
                    <p>Earned: <span className="font-semibold text-emerald-700">${a.stats.commissionEarned.toFixed(2)}</span></p>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={cn("inline-block px-2 py-0.5 rounded text-[11px] font-semibold", STATUS_COLORS[a.status] ?? "bg-gray-100 text-gray-500")}>
                      {a.status}
                    </span>
                    {a.approver && <p className="text-[10px] text-gray-400 mt-1">by {a.approver.name}</p>}
                  </td>
                  <td className="px-4 py-3.5 text-xs text-gray-400 whitespace-nowrap">{formatDate(a.createdAt)}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex flex-wrap gap-1.5">
                      {a.status === "PENDING" && (
                        <button onClick={() => act(a.id, "approve")} disabled={!!acting}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg hover:bg-emerald-100 disabled:opacity-50 transition-colors">
                          <CheckCircle className="w-3.5 h-3.5" />
                          {acting === a.id + "approve" ? "…" : "Approve"}
                        </button>
                      )}
                      {a.status === "ACTIVE" && (
                        <button onClick={() => act(a.id, "suspend")} disabled={!!acting}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-orange-50 text-orange-600 border border-orange-100 rounded-lg hover:bg-orange-100 disabled:opacity-50 transition-colors">
                          <PauseCircle className="w-3.5 h-3.5" />
                          {acting === a.id + "suspend" ? "…" : "Suspend"}
                        </button>
                      )}
                      {["PENDING", "ACTIVE", "SUSPENDED"].includes(a.status) && (
                        <button onClick={() => act(a.id, "ban")} disabled={!!acting}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-red-50 text-red-600 border border-red-100 rounded-lg hover:bg-red-100 disabled:opacity-50 transition-colors">
                          <Ban className="w-3.5 h-3.5" />
                          {acting === a.id + "ban" ? "…" : "Ban"}
                        </button>
                      )}
                      {["SUSPENDED", "BANNED"].includes(a.status) && (
                        <button onClick={() => act(a.id, "reactivate")} disabled={!!acting}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100 rounded-lg hover:bg-blue-100 disabled:opacity-50 transition-colors">
                          <RotateCcw className="w-3.5 h-3.5" />
                          {acting === a.id + "reactivate" ? "…" : "Reactivate"}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
