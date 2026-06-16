"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, MessageSquarePlus, ChevronRight, Users } from "lucide-react";
import { cn, LEAD_STATUS_LABELS, LEAD_INTENT_LABELS, STATUS_COLORS, formatDate } from "@/lib/utils";

interface AffiliateMeta { fullName: string; email: string; affiliateCode: string }
interface Commission { amount: number; status: string; releaseDate: string }

interface PipelineLead {
  id: string;
  fullName: string;
  emailAddress: string;
  phoneNumber: string;
  businessName: string;
  leadStatus: string;
  leadIntent: string | null;
  projectStatus: string | null;
  dealValue: number | null;
  onboardedAt: string | null;
  createdAt: string;
  industry: { name: string } | null;
  serviceTypeOpt: { name: string } | null;
  affiliate: AffiliateMeta | null;
  commission: Commission | null;
}

interface ActivityEntry {
  id: string;
  type: string;
  fromStatus: string | null;
  toStatus: string | null;
  note: string | null;
  createdAt: string;
  user: { name: string };
}

const PIPELINE_STATUSES = [
  { value: "ACCEPTED",        label: "Accepted" },
  { value: "QUOTATION_SENT",  label: "Quotation Sent" },
  { value: "NOT_RESPONDING",  label: "Not Responding" },
  { value: "MEETING_PENDING", label: "Meeting Pending" },
  { value: "MEETING_DONE",    label: "Meeting Done" },
  { value: "FOLLOW_UP",       label: "Follow Up" },
  { value: "ONBOARDED",       label: "Onboarded" },
  { value: "REJECTED",        label: "Rejected" },
];

const PROJECT_STATUSES = [
  { value: "ONGOING",   label: "Ongoing" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

const PROJECT_STATUS_COLORS: Record<string, string> = {
  ONGOING:   "bg-blue-50 text-blue-700",
  COMPLETED: "bg-emerald-50 text-emerald-700",
  CANCELLED: "bg-gray-100 text-gray-500",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold", STATUS_COLORS[status] ?? "bg-gray-100 text-gray-500")}>
      {LEAD_STATUS_LABELS[status] ?? status}
    </span>
  );
}

function ActivityItem({ entry }: { entry: ActivityEntry }) {
  if (entry.type === "NOTE") {
    return (
      <div className="flex gap-3 text-sm">
        <div className="w-7 h-7 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
          {entry.user.name[0]?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-700 text-xs">{entry.user.name}</p>
          <p className="text-gray-600 mt-0.5 leading-relaxed">{entry.note}</p>
          <p className="text-gray-400 text-xs mt-1">{formatDate(entry.createdAt)}</p>
        </div>
      </div>
    );
  }

  const isProjectChange = entry.type === "PROJECT_STATUS_CHANGE";
  const prefix = isProjectChange ? "Project" : "Status";
  const from = entry.fromStatus ? (isProjectChange ? entry.fromStatus : LEAD_STATUS_LABELS[entry.fromStatus] ?? entry.fromStatus) : null;
  const to = isProjectChange ? entry.toStatus : LEAD_STATUS_LABELS[entry.toStatus ?? ""] ?? entry.toStatus;

  return (
    <div className="flex gap-3 text-xs text-gray-500">
      <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
        <span className="text-gray-400 text-[10px] font-bold">→</span>
      </div>
      <div className="flex-1 pt-1">
        <span className="text-gray-400">{prefix} changed </span>
        {from && <><span className="font-medium text-gray-600">{from}</span><span className="text-gray-400"> → </span></>}
        <span className="font-semibold text-gray-700">{to}</span>
        <span className="text-gray-400"> by {entry.user.name} · {formatDate(entry.createdAt)}</span>
      </div>
    </div>
  );
}

export default function AffiliatePipelinePage() {
  const [leads, setLeads] = useState<PipelineLead[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [selected, setSelected] = useState<PipelineLead | null>(null);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [note, setNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [actingStatus, setActingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [newProjectStatus, setNewProjectStatus] = useState("");
  const [dealValue, setDealValue] = useState("");
  const [statusError, setStatusError] = useState("");

  const loadLeads = useCallback(async () => {
    const data = await fetch("/api/admin/affiliate/leads?view=pipeline").then((r) => r.json());
    setLeads(Array.isArray(data) ? data : []);
  }, []);

  const loadActivity = useCallback(async (id: string) => {
    const data = await fetch(`/api/admin/affiliate/leads/${id}/activity`).then((r) => r.json());
    setActivity(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => { loadLeads(); }, [loadLeads]);

  const openLead = (l: PipelineLead) => {
    setSelected(l);
    setNewStatus(l.leadStatus);
    setNewProjectStatus(l.projectStatus ?? "");
    setDealValue(l.dealValue ? String(l.dealValue) : "");
    setNote(""); setStatusError("");
    loadActivity(l.id);
  };

  const refreshSelected = useCallback(async (id: string) => {
    const data = await fetch(`/api/admin/affiliate/leads/${id}`).then((r) => r.json());
    setSelected(data);
    setNewStatus(data.leadStatus);
    setNewProjectStatus(data.projectStatus ?? "");
    setDealValue(data.dealValue ? String(data.dealValue) : "");
    loadLeads();
    loadActivity(id);
  }, [loadLeads, loadActivity]);

  const applyStatus = async () => {
    if (!selected || newStatus === selected.leadStatus) return;
    if (newStatus === "ONBOARDED" && (!dealValue || parseFloat(dealValue) <= 0)) {
      setStatusError("Enter a deal value before setting Onboarded");
      return;
    }
    setActingStatus(true); setStatusError("");
    const res = await fetch(`/api/admin/affiliate/leads/${selected.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "set_status", newStatus, dealValue }),
    });
    setActingStatus(false);
    if (!res.ok) {
      const e = await res.json();
      setStatusError(e.error ?? "Failed to update status");
    } else {
      refreshSelected(selected.id);
    }
  };

  const applyProjectStatus = async () => {
    if (!selected || !newProjectStatus || newProjectStatus === selected.projectStatus) return;
    setActingStatus(true);
    await fetch(`/api/admin/affiliate/leads/${selected.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "set_project_status", projectStatus: newProjectStatus }),
    });
    setActingStatus(false);
    refreshSelected(selected.id);
  };

  const addNote = async () => {
    if (!selected || !note.trim()) return;
    setSavingNote(true);
    await fetch(`/api/admin/affiliate/leads/${selected.id}/activity`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note }),
    });
    setSavingNote(false);
    setNote("");
    loadActivity(selected.id);
  };

  const filtered = leads.filter((l) => {
    const q = search.toLowerCase();
    const matchSearch = !q || [l.fullName, l.emailAddress, l.businessName, l.affiliate?.fullName ?? ""].some((v) =>
      v.toLowerCase().includes(q)
    );
    return matchSearch && (!filterStatus || l.leadStatus === filterStatus);
  });

  return (
    <div className="flex h-[calc(100vh-6rem)] gap-4 overflow-hidden">
      {/* Left: Lead list */}
      <div className={cn("flex flex-col min-w-0 bg-white rounded-xl border border-gray-200 overflow-hidden transition-all", selected ? "hidden lg:flex lg:w-80 lg:shrink-0" : "flex-1")}>
        <div className="px-4 py-3 border-b border-gray-100 shrink-0">
          <h1 className="text-sm font-bold text-gray-900 mb-2">Active Pipeline</h1>
          <div className="relative mb-2">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400/30 text-gray-700 placeholder:text-gray-300" />
          </div>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-600 bg-white">
            <option value="">All statuses</option>
            {PIPELINE_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-gray-400">
              <Users className="w-8 h-8 text-gray-200 mb-2" />
              <p className="text-sm text-gray-400">No leads found</p>
            </div>
          ) : filtered.map((l) => (
            <button key={l.id} onClick={() => openLead(l)} className={cn("w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-blue-50/30 transition-colors", selected?.id === l.id && "bg-blue-50 border-l-2 border-l-blue-500")}>
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-gray-800 truncate">{l.fullName}</p>
                <ChevronRight className="w-3.5 h-3.5 text-gray-300 shrink-0" />
              </div>
              <p className="text-xs text-gray-400 truncate">{l.businessName}</p>
              <div className="flex items-center gap-1.5 mt-1.5">
                <StatusBadge status={l.leadStatus} />
                {l.affiliate && <span className="text-[10px] text-gray-400 font-mono truncate">{l.affiliate.affiliateCode}</span>}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Right: Detail + activity panel */}
      {selected ? (
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Back button on mobile */}
          <button onClick={() => setSelected(null)} className="lg:hidden flex items-center gap-1.5 text-sm text-blue-600 font-medium mb-3">
            ← Back to list
          </button>

          <div className="flex-1 overflow-y-auto space-y-4">
            {/* Lead info card */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-base font-bold text-gray-900">{selected.fullName}</h2>
                  <p className="text-sm text-gray-500">{selected.businessName}</p>
                </div>
                <StatusBadge status={selected.leadStatus} />
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                {[
                  ["Email", selected.emailAddress],
                  ["Phone", selected.phoneNumber],
                  ["Industry", selected.industry?.name ?? "—"],
                  ["Service", selected.serviceTypeOpt?.name ?? "—"],
                  ["Intent", selected.leadIntent ? LEAD_INTENT_LABELS[selected.leadIntent] : "—"],
                  ["Affiliate", selected.affiliate?.fullName ?? "—"],
                  ["Submitted", formatDate(selected.createdAt)],
                  ...(selected.dealValue ? [["Deal Value", `$${selected.dealValue}`]] : []),
                  ...(selected.onboardedAt ? [["Onboarded", formatDate(selected.onboardedAt)]] : []),
                ].map(([k, v]) => (
                  <div key={k}>
                    <span className="text-xs text-gray-400 font-medium">{k}</span>
                    <p className="text-gray-700 font-medium text-xs mt-0.5">{v}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Commission info (if exists) */}
            {selected.commission && (
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-2">Commission</p>
                <div className="flex gap-6 text-sm">
                  <div>
                    <p className="text-xs text-emerald-600">Amount</p>
                    <p className="font-bold text-emerald-800">${Number(selected.commission.amount).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-emerald-600">Status</p>
                    <p className="font-semibold text-emerald-700">{selected.commission.status}</p>
                  </div>
                  <div>
                    <p className="text-xs text-emerald-600">Release</p>
                    <p className="font-medium text-emerald-700">{formatDate(selected.commission.releaseDate)}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Status control */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Update Status</p>
              {statusError && (
                <p className="mb-3 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-100">{statusError}</p>
              )}
              <div className="grid grid-cols-2 gap-2 mb-3">
                {PIPELINE_STATUSES.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => { setNewStatus(s.value); setStatusError(""); }}
                    className={cn(
                      "px-3 py-2 text-xs rounded-lg border transition-colors text-left font-medium",
                      newStatus === s.value ? "border-blue-400 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-600 hover:border-gray-300"
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              {newStatus === "ONBOARDED" && !selected.commission && (
                <div className="mb-3">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Deal Value (USD) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={dealValue}
                    onChange={(e) => setDealValue(e.target.value)}
                    placeholder="e.g. 2500.00"
                    className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400"
                  />
                  {dealValue && parseFloat(dealValue) > 0 && (
                    <p className="text-xs text-emerald-600 mt-1.5">
                      Commission: ${(parseFloat(dealValue) * 0.15).toFixed(2)} (15%) · Release date: {new Date(Date.now() + 25 * 86400000).toLocaleDateString()}
                    </p>
                  )}
                </div>
              )}

              <button
                onClick={applyStatus}
                disabled={actingStatus || newStatus === selected.leadStatus}
                className="w-full py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {actingStatus ? "Saving…" : "Apply Status"}
              </button>
            </div>

            {/* Project status (ONBOARDED leads) */}
            {(selected.leadStatus === "ONBOARDED" || selected.projectStatus) && (
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Project Status</p>
                {selected.projectStatus && (
                  <span className={cn("inline-block text-xs font-semibold px-2.5 py-1 rounded-full mb-3", PROJECT_STATUS_COLORS[selected.projectStatus])}>
                    Current: {selected.projectStatus}
                  </span>
                )}
                <div className="flex gap-2 mb-3">
                  {PROJECT_STATUSES.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => setNewProjectStatus(s.value)}
                      className={cn(
                        "flex-1 py-2 text-xs rounded-lg border font-medium transition-colors",
                        newProjectStatus === s.value ? "border-blue-400 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-600 hover:border-gray-300"
                      )}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
                <button
                  onClick={applyProjectStatus}
                  disabled={actingStatus || !newProjectStatus || newProjectStatus === selected.projectStatus}
                  className="w-full py-2 text-sm font-semibold bg-gray-800 text-white rounded-lg hover:bg-gray-900 disabled:opacity-50 transition-colors"
                >
                  {actingStatus ? "Saving…" : "Set Project Status"}
                </button>
              </div>
            )}

            {/* Activity log */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Activity Log</p>

              {/* Add note */}
              <div className="flex gap-2 mb-5">
                <textarea
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Add a note (call details, follow-up, etc.)"
                  className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 placeholder:text-gray-300 text-gray-700"
                />
                <button
                  onClick={addNote}
                  disabled={savingNote || !note.trim()}
                  className="px-3 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors shrink-0"
                  title="Add note"
                >
                  <MessageSquarePlus className="w-4 h-4" />
                </button>
              </div>

              {/* Entries */}
              <div className="space-y-4">
                {activity.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">No activity yet</p>
                ) : (
                  activity.map((entry) => <ActivityItem key={entry.id} entry={entry} />)
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="hidden lg:flex flex-1 items-center justify-center text-gray-400">
          <div className="text-center">
            <Users className="w-10 h-10 text-gray-200 mx-auto mb-2" />
            <p className="text-sm">Select a lead to view details</p>
          </div>
        </div>
      )}
    </div>
  );
}
