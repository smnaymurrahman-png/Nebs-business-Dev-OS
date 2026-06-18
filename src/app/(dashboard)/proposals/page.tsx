"use client";

import { useEffect, useState, useMemo, useRef, type ComponentType } from "react";
import { useSession } from "next-auth/react";
import { Modal } from "@/components/shared/Modal";
import { FormField, inputClass, selectClass } from "@/components/shared/FormField";
import { ExportButtons } from "@/components/shared/ExportButtons";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatCurrency, formatDate, PROPOSAL_STATUS_LABELS, SERVICE_TYPE_LABELS } from "@/lib/utils";
import {
  Plus, Pencil, Trash2, Search, FileText, Send, CheckCircle, DollarSign,
  ChevronDown, X, Filter, CalendarDays, UserCheck,
} from "lucide-react";

interface Proposal {
  id: string; platform: string; projectName: string; projectDetails: string;
  amount: number; proposal: string; messageToClient: string; connectIn: number;
  costing: number; serviceType: string; currentStatus: string; followUp: number;
  remark?: string; createdAt: string;
  client: { id: string; clientId: string; name: string; email: string; phone: string; country: string; businessName: string; platform: string };
  user?: { name: string };
}
interface TeamMember { id: string; name: string }
interface Client { id: string; clientId: string; name: string; email: string; phone: string; country: string; businessName: string; platform: string }

const SERVICE_TYPES = ["WORDPRESS", "FULL_STACK", "UI_UX", "WEBFLOW", "SHOPIFY", "DIGITAL_MARKETING", "OTHER"];
const STATUSES = ["PROPOSAL_SENT", "COMMUNICATION_RUNNING", "PAYMENT_PENDING", "PROPOSAL_REJECTED", "ORDER_COMPLETED"];
const emptyForm = { clientId: "", platform: "", projectName: "", projectDetails: "", amount: "", proposal: "", messageToClient: "", connectIn: "", costing: "", serviceType: "WORDPRESS" };
const AVATAR_COLORS = ["bg-blue-500", "bg-indigo-500", "bg-emerald-500", "bg-orange-500", "bg-pink-500"];

function Avatar({ name }: { name: string }) {
  const color = AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
  return (
    <div className={`w-7 h-7 rounded-md ${color} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
      {name[0]?.toUpperCase()}
    </div>
  );
}

function AvatarSm({ name }: { name: string }) {
  const color = AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
  return (
    <div className={`w-6 h-6 rounded-md ${color} flex items-center justify-center text-white text-[9px] font-bold shrink-0`}>
      {name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, iconBg, iconColor }: {
  icon: ComponentType<{ className?: string }>; label: string; value: string | number; iconBg: string; iconColor: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className={`w-9 h-9 rounded-lg ${iconBg} flex items-center justify-center`}>
        <Icon className={`w-4 h-4 ${iconColor}`} />
      </div>
      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mt-3">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
    </div>
  );
}

function MultiSelectDropdown({ label, options, selected, onChange, icon: Icon }: {
  label: string; options: string[]; selected: string[]; onChange: (v: string[]) => void;
  icon?: ComponentType<{ className?: string }>;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const toggle = (v: string) => onChange(selected.includes(v) ? selected.filter(s => s !== v) : [...selected, v]);
  const active = selected.length > 0;
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-1.5 px-3 py-2 text-[12px] font-semibold rounded-lg border transition-all ${active ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700"}`}>
        {Icon && <Icon className="w-3.5 h-3.5" />}
        {label}
        {active && <span className="w-4 h-4 bg-blue-600 text-white rounded-full text-[9px] font-bold flex items-center justify-center">{selected.length}</span>}
        <ChevronDown className="w-3 h-3 opacity-50" />
      </button>
      {open && (
        <div className="absolute top-full mt-1.5 left-0 z-50 bg-white border border-gray-200 rounded-xl shadow-lg min-w-[180px] py-1.5">
          {options.length === 0 ? <p className="px-3 py-2 text-xs text-gray-400">No options</p>
            : options.map(opt => (
              <label key={opt} className="flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 cursor-pointer">
                <input type="checkbox" checked={selected.includes(opt)} onChange={() => toggle(opt)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                <span className="text-[12px] text-gray-700 font-medium">{opt}</span>
              </label>
            ))}
          {active && (
            <>
              <div className="mx-2 my-1 h-px bg-gray-100" />
              <button onClick={() => { onChange([]); setOpen(false); }}
                className="w-full text-left px-3 py-1.5 text-[11px] text-red-500 font-semibold hover:bg-red-50">
                Clear selection
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function ProposalsPage() {
  const { data: session } = useSession();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [selectedBdmId, setSelectedBdmId] = useState("");
  const [search, setSearch] = useState("");

  // Filters
  const [filterAddedBy, setFilterAddedBy] = useState<string[]>([]);
  const [filterPlatform, setFilterPlatform] = useState<string[]>([]);
  const [filterService, setFilterService] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [showDateFilter, setShowDateFilter] = useState(false);
  const dateRef = useRef<HTMLDivElement>(null);

  // Multi-select
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());

  // Modals
  const [modal, setModal] = useState<"add" | "edit" | "update" | null>(null);
  const [selected, setSelected] = useState<Proposal | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [updateForm, setUpdateForm] = useState({ currentStatus: "", followUp: "0", remark: "" });
  const [clientInfo, setClientInfo] = useState<Client | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [updateError, setUpdateError] = useState("");

  useEffect(() => {
    const h = (e: MouseEvent) => { if (dateRef.current && !dateRef.current.contains(e.target as Node)) setShowDateFilter(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const load = () => fetch("/api/proposals").then(r => r.json()).then(setProposals);
  const loadTeam = () => fetch("/api/users").then(r => r.json()).then(setTeamMembers).catch(() => {});
  useEffect(() => { load(); loadTeam(); }, []);

  // Derived filter options
  const addedByOptions = useMemo(() => [...new Set(proposals.map(p => p.user?.name).filter(Boolean) as string[])].sort(), [proposals]);
  const platformOptions = useMemo(() => [...new Set(proposals.map(p => p.platform).filter(Boolean))].sort(), [proposals]);
  const serviceOptions = useMemo(() => SERVICE_TYPES.map(s => SERVICE_TYPE_LABELS[s] ?? s), []);

  const activeFilterCount = filterAddedBy.length + filterPlatform.length + filterService.length + filterStatus.length + (filterDateFrom || filterDateTo ? 1 : 0);

  const filtered = useMemo(() => proposals.filter(p => {
    if (search && ![ p.projectName, p.client.name, p.client.clientId, p.platform ].some(v => v.toLowerCase().includes(search.toLowerCase()))) return false;
    if (filterAddedBy.length && (!p.user?.name || !filterAddedBy.includes(p.user.name))) return false;
    if (filterPlatform.length && !filterPlatform.includes(p.platform)) return false;
    if (filterService.length && !filterService.includes(SERVICE_TYPE_LABELS[p.serviceType] ?? p.serviceType)) return false;
    if (filterStatus.length && !filterStatus.includes(PROPOSAL_STATUS_LABELS[p.currentStatus] ?? p.currentStatus)) return false;
    if (filterDateFrom && new Date(p.createdAt) < new Date(filterDateFrom)) return false;
    if (filterDateTo && new Date(p.createdAt) > new Date(filterDateTo + "T23:59:59")) return false;
    return true;
  }), [proposals, search, filterAddedBy, filterPlatform, filterService, filterStatus, filterDateFrom, filterDateTo]);

  const clearAllFilters = () => { setSearch(""); setFilterAddedBy([]); setFilterPlatform([]); setFilterService([]); setFilterStatus([]); setFilterDateFrom(""); setFilterDateTo(""); };

  // Multi-select
  const allChecked = filtered.length > 0 && filtered.every(p => checkedIds.has(p.id));
  const someChecked = filtered.some(p => checkedIds.has(p.id));
  const toggleAll = () => {
    if (allChecked) { const n = new Set(checkedIds); filtered.forEach(p => n.delete(p.id)); setCheckedIds(n); }
    else { const n = new Set(checkedIds); filtered.forEach(p => n.add(p.id)); setCheckedIds(n); }
  };
  const toggleOne = (id: string) => { const n = new Set(checkedIds); n.has(id) ? n.delete(id) : n.add(id); setCheckedIds(n); };

  const bulkDelete = async () => {
    if (!confirm(`Delete ${checkedIds.size} proposal(s)?`)) return;
    await Promise.all([...checkedIds].map(id => fetch(`/api/proposals/${id}`, { method: "DELETE" })));
    setCheckedIds(new Set()); load();
  };

  const lookupClient = async (clientId: string) => {
    if (!clientId) return;
    const res = await fetch(`/api/clients/lookup?clientId=${clientId}`);
    if (res.ok) { const c = await res.json(); setClientInfo(c); setForm(f => ({ ...f, platform: c.platform })); }
    else setClientInfo(null);
  };

  const openAdd = () => { setForm(emptyForm); setClientInfo(null); setError(""); setSelectedBdmId((session?.user as { id?: string })?.id ?? ""); setModal("add"); };
  const openEdit = (p: Proposal) => {
    setSelected(p);
    setForm({ clientId: p.client.clientId, platform: p.platform, projectName: p.projectName, projectDetails: p.projectDetails, amount: String(p.amount), proposal: p.proposal, messageToClient: p.messageToClient, connectIn: String(p.connectIn), costing: String(p.costing), serviceType: p.serviceType });
    setClientInfo(p.client); setError(""); setModal("edit");
  };
  const openUpdate = (p: Proposal) => {
    setSelected(p);
    setUpdateForm({ currentStatus: p.currentStatus, followUp: String(p.followUp), remark: p.remark ?? "" });
    setModal("update");
  };

  const save = async () => {
    setLoading(true); setError("");
    try {
      const payload = modal === "add" ? { ...form, ...(selectedBdmId && { createdById: selectedBdmId }) } : form;
      const res = modal === "add"
        ? await fetch("/api/proposals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
        : await fetch(`/api/proposals/${selected!.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!res.ok) { const e = await res.json(); setError(e.error ?? "Error"); return; }
      await load(); setModal(null);
    } finally { setLoading(false); }
  };

  const saveUpdate = async () => {
    setLoading(true); setUpdateError("");
    try {
      const res = await fetch(`/api/proposals/${selected!.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updateForm) });
      if (!res.ok) { const e = await res.json(); setUpdateError(e.error ?? "Update failed"); return; }
      await load(); setModal(null);
    } finally { setLoading(false); }
  };

  const del = async (id: string) => {
    if (!confirm("Delete this proposal?")) return;
    await fetch(`/api/proposals/${id}`, { method: "DELETE" });
    setCheckedIds(prev => { const n = new Set(prev); n.delete(id); return n; });
    load();
  };

  const exportData = filtered.map(p => ({
    "Client ID": p.client.clientId, "Client Name": p.client.name, "Platform": p.platform,
    "Project Name": p.projectName, "Service Type": SERVICE_TYPE_LABELS[p.serviceType] ?? p.serviceType,
    "Amount": p.amount, "Costing": p.costing, "Status": PROPOSAL_STATUS_LABELS[p.currentStatus] ?? p.currentStatus,
    "Follow Up": p.followUp, "Added By": p.user?.name ?? "", "Remark": p.remark ?? "", "Date": formatDate(p.createdAt),
  }));

  const sent = proposals.filter(p => p.currentStatus === "PROPOSAL_SENT").length;
  const completed = proposals.filter(p => p.currentStatus === "ORDER_COMPLETED").length;
  const revenue = proposals.filter(p => p.currentStatus === "ORDER_COMPLETED").reduce((s, p) => s + p.amount, 0);

  const inputCls = "px-3 py-1.5 text-[12px] border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400/30 text-gray-700 bg-white";

  // Status labels for filter display
  const statusLabels = useMemo(() => STATUSES.map(s => PROPOSAL_STATUS_LABELS[s] ?? s), []);

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard icon={FileText}    label="Total Proposals" value={proposals.length}      iconBg="bg-blue-50"    iconColor="text-blue-600" />
        <StatCard icon={Send}        label="Proposal Sent"   value={sent}                  iconBg="bg-sky-50"     iconColor="text-sky-600" />
        <StatCard icon={CheckCircle} label="Completed"       value={completed}             iconBg="bg-emerald-50" iconColor="text-emerald-600" />
        <StatCard icon={DollarSign}  label="Total Revenue"   value={formatCurrency(revenue)} iconBg="bg-amber-50" iconColor="text-amber-600" />
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search proposals…"
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 text-gray-700 placeholder:text-gray-400 transition-all" />
        </div>

        <MultiSelectDropdown label="Added By" options={addedByOptions} selected={filterAddedBy} onChange={setFilterAddedBy} icon={UserCheck} />
        <MultiSelectDropdown label="Platform" options={platformOptions} selected={filterPlatform} onChange={setFilterPlatform} />
        <MultiSelectDropdown label="Service" options={serviceOptions} selected={filterService} onChange={setFilterService} />
        <MultiSelectDropdown label="Status" options={statusLabels} selected={filterStatus} onChange={setFilterStatus} />

        {/* Date range */}
        <div className="relative" ref={dateRef}>
          <button onClick={() => setShowDateFilter(o => !o)}
            className={`flex items-center gap-1.5 px-3 py-2 text-[12px] font-semibold rounded-lg border transition-all ${filterDateFrom || filterDateTo ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700"}`}>
            <CalendarDays className="w-3.5 h-3.5" />
            Date
            {(filterDateFrom || filterDateTo) && <span className="w-2 h-2 bg-blue-600 rounded-full" />}
            <ChevronDown className="w-3 h-3 opacity-50" />
          </button>
          {showDateFilter && (
            <div className="absolute top-full mt-1.5 left-0 z-50 bg-white border border-gray-200 rounded-xl shadow-lg p-3 min-w-[220px] space-y-2">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Date range</p>
              <div>
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">From</label>
                <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} className={`w-full ${inputCls}`} />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">To</label>
                <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} className={`w-full ${inputCls}`} />
              </div>
              {(filterDateFrom || filterDateTo) && (
                <button onClick={() => { setFilterDateFrom(""); setFilterDateTo(""); }} className="text-[11px] text-red-500 font-semibold hover:text-red-600">Clear dates</button>
              )}
            </div>
          )}
        </div>

        {activeFilterCount > 0 && (
          <button onClick={clearAllFilters} className="flex items-center gap-1 px-2.5 py-2 text-[12px] font-semibold text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-all border border-transparent">
            <X className="w-3.5 h-3.5" /> Clear all
            <span className="ml-0.5 w-4 h-4 bg-red-100 text-red-500 rounded-full text-[9px] font-bold flex items-center justify-center">{activeFilterCount}</span>
          </button>
        )}

        <div className="ml-auto flex items-center gap-2 shrink-0">
          <ExportButtons data={exportData} filename="proposals" />
          <button onClick={openAdd} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-[13px] font-semibold rounded-lg hover:bg-blue-700 active:scale-[0.98] transition-all">
            <Plus className="w-4 h-4" /> Add Proposal
          </button>
        </div>
      </div>

      {/* Bulk action bar */}
      {someChecked && (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-blue-600 text-white rounded-xl">
          <span className="text-sm font-semibold">{checkedIds.size} selected</span>
          <div className="h-4 w-px bg-blue-400" />
          <button onClick={bulkDelete} className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold bg-red-500 hover:bg-red-600 rounded-lg transition-colors">
            <Trash2 className="w-3.5 h-3.5" /> Delete selected
          </button>
          <button onClick={() => setCheckedIds(new Set())} className="ml-auto text-[12px] font-medium text-blue-200 hover:text-white transition-colors">
            Deselect all
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
          {activeFilterCount > 0 && <Filter className="w-3.5 h-3.5 text-blue-500" />}
          <h2 className="text-[13px] font-semibold text-gray-700">{activeFilterCount > 0 ? "Filtered" : "All"} Proposals</h2>
          <span className="bg-gray-100 text-gray-500 text-[11px] px-2 py-0.5 rounded-full font-semibold">{filtered.length}</span>
          {activeFilterCount > 0 && proposals.length !== filtered.length && (
            <span className="text-[11px] text-gray-400">of {proposals.length}</span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 w-10">
                  <input type="checkbox" checked={allChecked}
                    ref={el => { if (el) el.indeterminate = someChecked && !allChecked; }}
                    onChange={toggleAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                </th>
                {["Client", "Project", "Platform", "Service", "Amount", "Costing", "Status", "FU", "Added By", "Date", ""].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={12}>
                  <div className="flex flex-col items-center justify-center py-16 gap-2">
                    <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-gray-300" />
                    </div>
                    <p className="text-[13px] font-medium text-gray-500">No proposals match your filters</p>
                    <button onClick={clearAllFilters} className="text-[12px] text-blue-500 font-semibold hover:underline">Clear filters</button>
                  </div>
                </td></tr>
              ) : filtered.map(p => {
                const checked = checkedIds.has(p.id);
                return (
                  <tr key={p.id} className={`border-b border-gray-100 last:border-0 transition-colors ${checked ? "bg-blue-50/60" : "hover:bg-blue-50/30"}`}>
                    <td className="px-4 py-3.5">
                      <input type="checkbox" checked={checked} onChange={() => toggleOne(p.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={p.client.name} />
                        <div>
                          <p className="text-[13px] font-semibold text-gray-700 whitespace-nowrap">{p.client.name}</p>
                          <p className="text-[11px] text-gray-400 font-mono">{p.client.clientId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-[13px] font-medium text-gray-700 max-w-[140px] truncate">{p.projectName}</td>
                    <td className="px-4 py-3.5 text-[12px] text-gray-500 whitespace-nowrap">{p.platform}</td>
                    <td className="px-4 py-3.5 text-[12px] text-gray-500 whitespace-nowrap">{SERVICE_TYPE_LABELS[p.serviceType] ?? p.serviceType}</td>
                    <td className="px-4 py-3.5 text-[13px] font-semibold text-gray-700 whitespace-nowrap">{formatCurrency(p.amount)}</td>
                    <td className="px-4 py-3.5 text-[12px] text-gray-500 whitespace-nowrap">{formatCurrency(p.costing)}</td>
                    <td className="px-4 py-3.5"><StatusBadge status={p.currentStatus} label={PROPOSAL_STATUS_LABELS[p.currentStatus] ?? p.currentStatus} /></td>
                    <td className="px-4 py-3.5 text-[12px] text-center text-gray-500">{p.followUp > 0 ? `FU ${p.followUp}` : <span className="text-gray-300">—</span>}</td>
                    <td className="px-4 py-3.5">
                      {p.user?.name ? (
                        <div className="flex items-center gap-1.5">
                          <AvatarSm name={p.user.name} />
                          <span className="text-[12px] text-gray-500 truncate max-w-[90px]">{p.user.name}</span>
                        </div>
                      ) : <span className="text-gray-300 text-[12px]">—</span>}
                    </td>
                    <td className="px-4 py-3.5 text-[12px] text-gray-400 whitespace-nowrap">{formatDate(p.createdAt)}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openUpdate(p)} className="px-2.5 py-1 text-[11px] font-semibold bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors whitespace-nowrap">
                          Update
                        </button>
                        <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors" title="Edit">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => del(p.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors" title="Delete">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit modal */}
      <Modal isOpen={modal === "add" || modal === "edit"} onClose={() => setModal(null)} title={modal === "add" ? "Add Proposal" : "Edit Proposal"} size="xl">
        {error && <p className="mb-3 text-sm text-red-600 bg-red-50 p-3 rounded-lg font-medium">{error}</p>}
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Client ID" required>
            <div className="flex gap-2">
              <input value={form.clientId} onChange={e => setForm({ ...form, clientId: e.target.value })} className={inputClass()} placeholder="CLT-XXXX-XXXX" />
              <button onClick={() => lookupClient(form.clientId)} className="px-3 py-2 text-xs font-semibold bg-blue-600 text-white rounded-lg whitespace-nowrap hover:bg-blue-700">Lookup</button>
            </div>
          </FormField>
          {clientInfo && (
            <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-800">
              <p><strong>{clientInfo.name}</strong> · {clientInfo.email}</p>
              <p>{clientInfo.businessName} · {clientInfo.country}</p>
            </div>
          )}
          <FormField label="Platform" required>
            <input value={form.platform} onChange={e => setForm({ ...form, platform: e.target.value })} className={inputClass()} placeholder="Upwork, Fiverr…" />
          </FormField>
          <FormField label="Project Name" required>
            <input value={form.projectName} onChange={e => setForm({ ...form, projectName: e.target.value })} className={inputClass()} placeholder="Project title" />
          </FormField>
          <FormField label="Service Type" required>
            <select value={form.serviceType} onChange={e => setForm({ ...form, serviceType: e.target.value })} className={selectClass()}>
              {SERVICE_TYPES.map(s => <option key={s} value={s}>{SERVICE_TYPE_LABELS[s]}</option>)}
            </select>
          </FormField>
          <FormField label="Amount (USD)" required>
            <input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className={inputClass()} placeholder="0.00" />
          </FormField>
          <FormField label="Costing (USD)" required>
            <input type="number" value={form.costing} onChange={e => setForm({ ...form, costing: e.target.value })} className={inputClass()} placeholder="0.00" />
          </FormField>
          <FormField label="Connect In" required>
            <input type="number" value={form.connectIn} onChange={e => setForm({ ...form, connectIn: e.target.value })} className={inputClass()} placeholder="0" />
          </FormField>
          <FormField label="Project Details" className="col-span-2">
            <textarea rows={3} value={form.projectDetails} onChange={e => setForm({ ...form, projectDetails: e.target.value })} className={inputClass()} placeholder="Project description…" />
          </FormField>
          <FormField label="Proposal" className="col-span-2">
            <textarea rows={3} value={form.proposal} onChange={e => setForm({ ...form, proposal: e.target.value })} className={inputClass()} placeholder="Proposal content…" />
          </FormField>
          <FormField label="Message to Client" className="col-span-2">
            <textarea rows={2} value={form.messageToClient} onChange={e => setForm({ ...form, messageToClient: e.target.value })} className={inputClass()} placeholder="Message…" />
          </FormField>
          {modal === "add" && teamMembers.length > 0 && (
            <FormField label="Added By (BDM)" className="col-span-2">
              <select value={selectedBdmId} onChange={e => setSelectedBdmId(e.target.value)} className={selectClass()}>
                <option value="">— Select team member —</option>
                {teamMembers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </FormField>
          )}
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={() => setModal(null)} className="px-4 py-2 text-sm font-medium border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600">Cancel</button>
          <button onClick={save} disabled={loading} className="px-5 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-all">
            {loading ? "Saving…" : "Save"}
          </button>
        </div>
      </Modal>

      {/* Update status modal */}
      <Modal isOpen={modal === "update"} onClose={() => setModal(null)} title="Update Proposal Status">
        {updateError && <p className="mb-3 text-sm text-red-600 bg-red-50 p-3 rounded-lg font-medium">{updateError}</p>}
        <div className="space-y-4">
          <FormField label="Current Status">
            <select value={updateForm.currentStatus} onChange={e => setUpdateForm({ ...updateForm, currentStatus: e.target.value })} className={selectClass()}>
              {STATUSES.map(s => <option key={s} value={s}>{PROPOSAL_STATUS_LABELS[s]}</option>)}
            </select>
          </FormField>
          <FormField label="Follow Up">
            <select value={updateForm.followUp} onChange={e => setUpdateForm({ ...updateForm, followUp: e.target.value })} className={selectClass()}>
              {[0, 1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n === 0 ? "None" : `Follow Up ${n}`}</option>)}
            </select>
          </FormField>
          <FormField label="Remark">
            <textarea rows={3} value={updateForm.remark} onChange={e => setUpdateForm({ ...updateForm, remark: e.target.value })} className={inputClass()} placeholder="Add a remark…" />
          </FormField>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={() => setModal(null)} className="px-4 py-2 text-sm font-medium border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600">Cancel</button>
          <button onClick={saveUpdate} disabled={loading} className="px-5 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-all">
            {loading ? "Saving…" : "Update"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
