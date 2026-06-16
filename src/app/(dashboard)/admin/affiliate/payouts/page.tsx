"use client";

import { useEffect, useState, useCallback } from "react";
import { Wallet, CheckCircle, DollarSign, XCircle } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";

interface AffiliateMeta { fullName: string; email: string; affiliateCode: string }
interface PayoutMethodMeta { type: string; details: Record<string, string> }

interface Payout {
  id: string;
  amount: number;
  status: string;
  rejectReason: string | null;
  paidAt: string | null;
  createdAt: string;
  affiliate: AffiliateMeta;
  payoutMethod: PayoutMethodMeta;
  processor: { name: string } | null;
}

const METHOD_LABELS: Record<string, string> = {
  BKASH: "bKash",
  NAGAD: "Nagad",
  BANK: "Bank",
  INTERNATIONAL: "Int'l Transfer",
};

const STATUS_COLORS: Record<string, string> = {
  REQUESTED: "bg-amber-50 text-amber-700",
  APPROVED:  "bg-blue-50 text-blue-700",
  PAID:      "bg-emerald-50 text-emerald-700",
  REJECTED:  "bg-red-50 text-red-600",
};

function MethodSummary({ type, details }: { type: string; details: Record<string, string> }) {
  const primary = details.number ?? details.accountNumber ?? "";
  const bank = details.bankName ?? "";
  return (
    <div>
      <p className="text-xs font-semibold text-gray-600">{METHOD_LABELS[type] ?? type}</p>
      {bank && <p className="text-xs text-gray-400">{bank}</p>}
      {primary && <p className="text-xs text-gray-500 font-mono">{primary}</p>}
    </div>
  );
}

interface RejectModalProps {
  payout: Payout;
  onClose: () => void;
  onSaved: () => void;
}

function RejectModal({ payout, onClose, onSaved }: RejectModalProps) {
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await fetch(`/api/admin/affiliate/payouts/${payout.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reject", rejectReason: reason }),
    });
    setSaving(false);
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-[2px]" onClick={onClose} />
      <form onSubmit={submit} className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-base font-bold text-gray-900 mb-1">Reject Payout</h2>
        <p className="text-xs text-gray-500 mb-4">{payout.affiliate.fullName} — ${Number(payout.amount).toFixed(2)}</p>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Reason (optional)</label>
        <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3}
          placeholder="Explain the rejection reason…"
          className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-red-400/30 text-gray-700 placeholder:text-gray-300 mb-4" />
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800">Cancel</button>
          <button type="submit" disabled={saving}
            className="px-5 py-2 text-sm font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors">
            {saving ? "Rejecting…" : "Reject"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function AdminPayoutsPage() {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [tab, setTab] = useState<"queue" | "all">("queue");
  const [acting, setActing] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<Payout | null>(null);

  const load = useCallback(async () => {
    const view = tab === "queue" ? "queue" : "all";
    const data = await fetch(`/api/admin/affiliate/payouts?view=${view}`).then((r) => r.json());
    setPayouts(Array.isArray(data) ? data : []);
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  const act = async (id: string, action: "approve" | "mark_paid") => {
    setActing(id + action);
    await fetch(`/api/admin/affiliate/payouts/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setActing(null);
    load();
  };

  const queue = payouts.filter((p) => p.status === "REQUESTED");
  const approved = payouts.filter((p) => p.status === "APPROVED");

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Payout Management</h1>
        <p className="text-sm text-gray-500 mt-0.5">Review and process affiliate withdrawal requests</p>
      </div>

      {/* Stats (queue view only) */}
      {tab === "queue" && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Pending Review", value: queue.length, icon: Wallet, cls: "bg-amber-50 text-amber-600" },
            { label: "Awaiting Payment", value: approved.length, icon: CheckCircle, cls: "bg-blue-50 text-blue-600" },
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
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {([["queue", "Active Queue"], ["all", "All Payouts"]] as const).map(([v, l]) => (
          <button key={v} onClick={() => setTab(v)}
            className={cn("px-4 py-1.5 text-xs font-semibold rounded-md transition-colors", tab === v ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700")}>
            {l}
          </button>
        ))}
      </div>

      {/* Payouts table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Affiliate", "Amount", "Method", "Status", "Date", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payouts.length === 0 ? (
                <tr><td colSpan={6}>
                  <div className="flex flex-col items-center py-16 text-gray-400">
                    <Wallet className="w-8 h-8 text-gray-200 mb-2" />
                    <p className="text-sm">{tab === "queue" ? "No pending requests" : "No payouts found"}</p>
                  </div>
                </td></tr>
              ) : payouts.map((p) => (
                <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3.5">
                    <p className="text-sm font-semibold text-gray-800">{p.affiliate.fullName}</p>
                    <p className="text-xs text-gray-400 font-mono">{p.affiliate.affiliateCode}</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="text-base font-bold text-gray-900">${Number(p.amount).toFixed(2)}</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <MethodSummary type={p.payoutMethod.type} details={p.payoutMethod.details} />
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={cn("inline-block px-2 py-0.5 rounded text-[11px] font-semibold", STATUS_COLORS[p.status] ?? "bg-gray-100 text-gray-500")}>
                      {p.status}
                    </span>
                    {p.rejectReason && <p className="text-xs text-red-500 mt-0.5 max-w-[160px] truncate">{p.rejectReason}</p>}
                    {p.processor && <p className="text-xs text-gray-400 mt-0.5">by {p.processor.name}</p>}
                  </td>
                  <td className="px-4 py-3.5 text-xs text-gray-400 whitespace-nowrap">
                    {formatDate(p.createdAt)}
                    {p.paidAt && <p className="text-emerald-600 font-medium">Paid {formatDate(p.paidAt)}</p>}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5">
                      {p.status === "REQUESTED" && (
                        <button onClick={() => act(p.id, "approve")} disabled={!!acting}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100 rounded-lg hover:bg-blue-100 disabled:opacity-50 transition-colors">
                          <CheckCircle className="w-3.5 h-3.5" />
                          {acting === p.id + "approve" ? "…" : "Approve"}
                        </button>
                      )}
                      {p.status === "APPROVED" && (
                        <button onClick={() => act(p.id, "mark_paid")} disabled={!!acting}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg hover:bg-emerald-100 disabled:opacity-50 transition-colors">
                          <DollarSign className="w-3.5 h-3.5" />
                          {acting === p.id + "mark_paid" ? "…" : "Mark Paid"}
                        </button>
                      )}
                      {["REQUESTED", "APPROVED"].includes(p.status) && (
                        <button onClick={() => setRejectTarget(p)}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-red-50 text-red-600 border border-red-100 rounded-lg hover:bg-red-100 transition-colors">
                          <XCircle className="w-3.5 h-3.5" /> Reject
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

      {rejectTarget && (
        <RejectModal payout={rejectTarget} onClose={() => setRejectTarget(null)} onSaved={load} />
      )}
    </div>
  );
}
