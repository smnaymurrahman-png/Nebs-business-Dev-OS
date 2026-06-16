"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Trash2, Search, Users, CheckSquare, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import { LEAD_STATUS_LABELS, LEAD_INTENT_LABELS, STATUS_COLORS, formatDate } from "@/lib/utils";

interface Lookup { id: string; name: string }

interface AffiliateLead {
  id: string;
  fullName: string;
  emailAddress: string;
  phoneNumber: string;
  businessName: string;
  leadStatus: string;
  leadIntent: string | null;
  referenceAmount: number | null;
  createdAt: string;
  industry: Lookup | null;
  serviceTypeOpt: Lookup | null;
}

const INTENT_OPTIONS = [
  { value: "NEED_QUOTATION", label: "Need Quotation" },
  { value: "INTERESTED",     label: "Interested in Service" },
  { value: "URGENT",         label: "Urgently Needed" },
];

const AFFILIATE_STATUSES = [
  "SUBMITTED", "ACCEPTED", "QUOTATION_SENT", "NOT_RESPONDING",
  "MEETING_PENDING", "MEETING_DONE", "FOLLOW_UP", "ONBOARDED", "REJECTED",
];

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn(
      "inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold",
      STATUS_COLORS[status] ?? "bg-gray-100 text-gray-600"
    )}>
      {LEAD_STATUS_LABELS[status] ?? status}
    </span>
  );
}

const inputCls = "w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400 bg-white text-gray-700 placeholder:text-gray-300 transition-all";
const selectCls = inputCls + " appearance-none";

export default function AffiliateLeadsPage() {
  const [leads, setLeads] = useState<AffiliateLead[]>([]);
  const [industries, setIndustries] = useState<Lookup[]>([]);
  const [serviceTypes, setServiceTypes] = useState<Lookup[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const [form, setForm] = useState({
    fullName: "", emailAddress: "", phoneNumber: "", businessName: "",
    industryId: "", serviceTypeId: "", referenceAmount: "", leadIntent: "",
  });

  const load = useCallback(async () => {
    const [l, i, s] = await Promise.all([
      fetch("/api/affiliate/leads").then((r) => r.json()),
      fetch("/api/affiliate/industries").then((r) => r.json()),
      fetch("/api/affiliate/service-types").then((r) => r.json()),
    ]);
    setLeads(Array.isArray(l) ? l : []);
    setIndustries(Array.isArray(i) ? i : []);
    setServiceTypes(Array.isArray(s) ? s : []);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = leads.filter((l) => {
    const q = search.toLowerCase();
    const matchSearch = !q || [l.fullName, l.emailAddress, l.businessName, l.phoneNumber]
      .some((v) => v.toLowerCase().includes(q));
    const matchStatus = !filterStatus || l.leadStatus === filterStatus;
    return matchSearch && matchStatus;
  });

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectableIds = leads
    .filter((l) => l.leadStatus === "SUBMITTED")
    .map((l) => l.id);

  const allSelected =
    selectableIds.length > 0 && selectableIds.every((id) => selected.has(id));

  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(selectableIds));
  };

  const deleteSelected = async () => {
    if (!selected.size) return;
    if (!confirm(`Delete ${selected.size} lead(s)?`)) return;
    await Promise.all(
      [...selected].map((id) =>
        fetch(`/api/affiliate/leads/${id}`, { method: "DELETE" })
      )
    );
    setSelected(new Set());
    load();
  };

  const openAdd = () => {
    setForm({ fullName: "", emailAddress: "", phoneNumber: "", businessName: "", industryId: "", serviceTypeId: "", referenceAmount: "", leadIntent: "" });
    setError(""); setConfirmed(false); setShowAdd(true);
  };

  const submitLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmed) { setError("Please confirm the information is accurate"); return; }
    setLoading(true); setError("");
    const res = await fetch("/api/affiliate/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, confirmed }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Submission failed");
    } else {
      setShowAdd(false);
      load();
    }
  };

  const setF = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-900">My Leads</h1>
          <p className="text-sm text-gray-500 mt-0.5">{leads.length} lead{leads.length !== 1 ? "s" : ""} submitted</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 text-white text-sm font-semibold rounded-lg hover:bg-violet-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Lead
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[160px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search leads…"
            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400 bg-white placeholder:text-gray-300 text-gray-700 transition-all"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400 bg-white text-gray-700 appearance-none"
        >
          <option value="">All statuses</option>
          {AFFILIATE_STATUSES.map((s) => (
            <option key={s} value={s}>{LEAD_STATUS_LABELS[s]}</option>
          ))}
        </select>
        {selected.size > 0 && (
          <button
            onClick={deleteSelected}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold bg-red-50 text-red-600 border border-red-100 rounded-lg hover:bg-red-100 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete ({selected.size})
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 w-10">
                  <button onClick={toggleAll} className="text-gray-400 hover:text-gray-600">
                    {allSelected ? <CheckSquare className="w-4 h-4 text-violet-600" /> : <Square className="w-4 h-4" />}
                  </button>
                </th>
                {["Name", "Email", "Phone", "Business", "Industry", "Intent", "Status", "Date"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9}>
                    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                      <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-3">
                        <Users className="w-5 h-5 text-gray-300" />
                      </div>
                      <p className="text-sm font-medium text-gray-500">
                        {search || filterStatus ? "No leads match your filters" : "No leads yet"}
                      </p>
                      {!search && !filterStatus && (
                        <p className="text-xs mt-1 text-gray-400">Add your first lead to get started</p>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((l) => {
                  const isSelectable = l.leadStatus === "SUBMITTED";
                  const isSelected = selected.has(l.id);
                  return (
                    <tr key={l.id} className={cn("border-b border-gray-100 hover:bg-violet-50/20 transition-colors", isSelected && "bg-violet-50/40")}>
                      <td className="px-4 py-3">
                        {isSelectable ? (
                          <button onClick={() => toggleSelect(l.id)} className="text-gray-400 hover:text-violet-600">
                            {isSelected ? <CheckSquare className="w-4 h-4 text-violet-600" /> : <Square className="w-4 h-4" />}
                          </button>
                        ) : (
                          <span className="block w-4 h-4" />
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-semibold text-gray-700">{l.fullName}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{l.emailAddress}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{l.phoneNumber}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{l.businessName}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{l.industry?.name ?? <span className="text-gray-300">—</span>}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {l.leadIntent ? LEAD_INTENT_LABELS[l.leadIntent] : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={l.leadStatus} /></td>
                      <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{formatDate(l.createdAt)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Lead modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-[2px]" onClick={() => setShowAdd(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-base font-bold text-gray-900">Add New Lead</h2>
              <button onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-gray-600 text-xl font-light">×</button>
            </div>
            <form onSubmit={submitLead} className="px-6 py-5 space-y-4">
              {error && (
                <div className={cn(
                  "text-sm rounded-lg px-4 py-3 font-medium",
                  error === "This lead already exists in the system."
                    ? "bg-amber-50 border border-amber-100 text-amber-700"
                    : "bg-red-50 border border-red-100 text-red-600"
                )}>
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Full Name *</label>
                  <input required value={form.fullName} onChange={setF("fullName")} placeholder="Jane Smith" className={inputCls} />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Business Name *</label>
                  <input required value={form.businessName} onChange={setF("businessName")} placeholder="Acme Corp" className={inputCls} />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Email Address *</label>
                  <input required type="email" value={form.emailAddress} onChange={setF("emailAddress")} placeholder="jane@acme.com" className={inputCls} />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Phone Number *</label>
                  <input required value={form.phoneNumber} onChange={setF("phoneNumber")} placeholder="+880 1XXX-XXXXXX" className={inputCls} />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Industry</label>
                  <select value={form.industryId} onChange={setF("industryId")} className={selectCls}>
                    <option value="">Select industry</option>
                    {industries.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Service Type</label>
                  <select value={form.serviceTypeId} onChange={setF("serviceTypeId")} className={selectCls}>
                    <option value="">Select service</option>
                    {serviceTypes.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Lead Type *</label>
                  <select required value={form.leadIntent} onChange={setF("leadIntent")} className={selectCls}>
                    <option value="">Select type</option>
                    {INTENT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Reference Amount</label>
                  <input type="number" min="0" step="0.01" value={form.referenceAmount} onChange={setF("referenceAmount")} placeholder="0.00" className={inputCls} />
                </div>
              </div>

              {/* Confirm checkbox */}
              <label className="flex items-start gap-3 pt-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-violet-600 shrink-0"
                />
                <span className="text-sm text-gray-600">
                  I confirm the information above is accurate and this lead has not been previously submitted to Nebs.
                </span>
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm font-medium border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !confirmed}
                  className="px-5 py-2 text-sm font-semibold bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-all"
                >
                  {loading ? "Submitting…" : "Submit Lead"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
