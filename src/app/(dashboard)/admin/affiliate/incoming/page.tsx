"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, CheckCircle, XCircle, Eye, Users, Clock } from "lucide-react";
import { cn, LEAD_STATUS_LABELS, LEAD_INTENT_LABELS, formatDate } from "@/lib/utils";

interface AffiliateMeta {
  fullName: string;
  email: string;
  affiliateCode: string;
}

interface IncomingLead {
  id: string;
  fullName: string;
  emailAddress: string;
  phoneNumber: string;
  businessName: string;
  leadStatus: string;
  leadIntent: string | null;
  referenceAmount: number | null;
  createdAt: string;
  industry: { name: string } | null;
  serviceTypeOpt: { name: string } | null;
  affiliate: AffiliateMeta | null;
}

function StatusBadge({ label, cls }: { label: string; cls: string }) {
  return <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold", cls)}>{label}</span>;
}

export default function AffiliateIncomingPage() {
  const [leads, setLeads] = useState<IncomingLead[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [acting, setActing] = useState<string | null>(null);
  const [detailLead, setDetailLead] = useState<IncomingLead | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetch("/api/admin/affiliate/leads?view=incoming").then((r) => r.json());
    setLeads(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const act = async (id: string, action: "accept" | "reject") => {
    setActing(id + action);
    await fetch(`/api/admin/affiliate/leads/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setActing(null);
    if (detailLead?.id === id) setDetailLead(null);
    load();
  };

  const filtered = leads.filter((l) => {
    const q = search.toLowerCase();
    return !q || [l.fullName, l.emailAddress, l.businessName, l.affiliate?.fullName ?? ""].some((v) =>
      v.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Incoming Lead Requests</h1>
        <p className="text-sm text-gray-500 mt-0.5">Affiliate-submitted leads awaiting review</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="w-8 h-8 bg-violet-50 rounded-lg flex items-center justify-center mb-2">
            <Clock className="w-4 h-4 text-violet-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{leads.length}</p>
          <p className="text-xs text-gray-400 font-medium mt-0.5">Pending Review</p>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, business, affiliate…"
            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 bg-white placeholder:text-gray-300 text-gray-700 transition-all"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Lead", "Contact", "Business", "Industry / Intent", "Submitted By", "Date", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12 text-sm text-gray-400">Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7}>
                  <div className="flex flex-col items-center py-16 text-gray-400">
                    <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-3">
                      <Users className="w-5 h-5 text-gray-300" />
                    </div>
                    <p className="text-sm font-medium text-gray-500">No incoming requests</p>
                  </div>
                </td></tr>
              ) : (
                filtered.map((l) => (
                  <tr key={l.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3.5">
                      <p className="text-sm font-semibold text-gray-800">{l.fullName}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-sm text-gray-600">{l.emailAddress}</p>
                      <p className="text-xs text-gray-400">{l.phoneNumber}</p>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-gray-600">{l.businessName}</td>
                    <td className="px-4 py-3.5">
                      <p className="text-xs text-gray-500">{l.industry?.name ?? "—"}</p>
                      {l.leadIntent && (
                        <p className="text-xs text-gray-400 mt-0.5">{LEAD_INTENT_LABELS[l.leadIntent]}</p>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      {l.affiliate ? (
                        <>
                          <p className="text-sm font-medium text-gray-700">{l.affiliate.fullName}</p>
                          <p className="text-xs text-gray-400 font-mono">{l.affiliate.affiliateCode}</p>
                        </>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-gray-400 whitespace-nowrap">{formatDate(l.createdAt)}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setDetailLead(l)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => act(l.id, "accept")}
                          disabled={!!acting}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg hover:bg-emerald-100 disabled:opacity-50 transition-colors"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          {acting === l.id + "accept" ? "…" : "Accept"}
                        </button>
                        <button
                          onClick={() => act(l.id, "reject")}
                          disabled={!!acting}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-red-50 text-red-600 border border-red-100 rounded-lg hover:bg-red-100 disabled:opacity-50 transition-colors"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          {acting === l.id + "reject" ? "…" : "Reject"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details modal */}
      {detailLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-[2px]" onClick={() => setDetailLead(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-base font-bold text-gray-900">Lead Details</h2>
              <button onClick={() => setDetailLead(null)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {[
                ["Full Name", detailLead.fullName],
                ["Email", detailLead.emailAddress],
                ["Phone", detailLead.phoneNumber],
                ["Business", detailLead.businessName],
                ["Industry", detailLead.industry?.name ?? "—"],
                ["Service Type", detailLead.serviceTypeOpt?.name ?? "—"],
                ["Lead Intent", detailLead.leadIntent ? LEAD_INTENT_LABELS[detailLead.leadIntent] : "—"],
                ["Reference Amount", detailLead.referenceAmount ? `$${detailLead.referenceAmount}` : "—"],
                ["Submitted By", detailLead.affiliate ? `${detailLead.affiliate.fullName} (${detailLead.affiliate.affiliateCode})` : "—"],
                ["Submitted On", formatDate(detailLead.createdAt)],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4 text-sm py-1 border-b border-gray-50">
                  <span className="text-gray-400 font-medium shrink-0">{label}</span>
                  <span className="text-gray-700 text-right">{value}</span>
                </div>
              ))}
            </div>
            <div className="px-6 pb-6 flex justify-end gap-2">
              <button
                onClick={() => { act(detailLead.id, "reject"); setDetailLead(null); }}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-red-50 text-red-600 border border-red-100 rounded-lg hover:bg-red-100 transition-colors"
              >
                <XCircle className="w-4 h-4" /> Reject
              </button>
              <button
                onClick={() => { act(detailLead.id, "accept"); setDetailLead(null); }}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                <CheckCircle className="w-4 h-4" /> Accept Lead
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
