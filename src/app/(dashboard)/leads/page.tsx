"use client";

import { useEffect, useState, useMemo, useRef, type ComponentType } from "react";
import { Modal } from "@/components/shared/Modal";
import { FormField, inputClass, selectClass } from "@/components/shared/FormField";
import { ExportButtons } from "@/components/shared/ExportButtons";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatDate, LEAD_STATUS_LABELS } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  Plus, Pencil, Trash2, Search, Users, Flame, ThumbsUp, Clock,
  ChevronDown, X, Filter, CalendarDays, UserCheck,
} from "lucide-react";

interface Lead {
  id: string; fullName: string; emailAddress: string; phoneNumber: string;
  website?: string; businessName: string; businessDetails: string;
  leadType: string; leadFrom: string; isPaid: boolean; connection?: string;
  leadStatus: string; lastUpdate?: string; createdAt: string;
  user?: { name: string };
}

const LEAD_TYPES = ["COLD", "HOT", "WARM"];
const CONNECTIONS = ["BY_PHONE", "BY_EMAIL", "BY_WHATSAPP"];
const STATUSES = ["INTERESTED", "NOT_INTERESTED", "NO_RESPONSE", "FOLLOW_UP", "PENDING_DECISION"];
const CONNECTION_LABELS: Record<string, string> = { BY_PHONE: "By Phone", BY_EMAIL: "By Email", BY_WHATSAPP: "By WhatsApp" };
const LEAD_TYPE_STYLES: Record<string, string> = {
  HOT:  "bg-red-50 text-red-700 ring-1 ring-red-100",
  WARM: "bg-orange-50 text-orange-700 ring-1 ring-orange-100",
  COLD: "bg-sky-50 text-sky-700 ring-1 ring-sky-100",
};

const emptyForm = { fullName: "", emailAddress: "", phoneNumber: "", website: "", businessName: "", businessDetails: "", leadType: "COLD", leadFrom: "", isPaid: "false" };
const emptyUpdate = { connection: "", leadStatus: "INTERESTED", lastUpdate: "" };
const AVATAR_COLORS = ["bg-blue-500", "bg-indigo-500", "bg-emerald-500", "bg-orange-500", "bg-pink-500"];

// ── Helpers ───────────────────────────────────────────────────────────────────

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

// ── Multi-select dropdown ─────────────────────────────────────────────────────

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

// ── Main page ─────────────────────────────────────────────────────────────────

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [search, setSearch] = useState("");

  // Filters
  const [filterAddedBy, setFilterAddedBy] = useState<string[]>([]);
  const [filterSource, setFilterSource] = useState<string[]>([]);
  const [filterType, setFilterType] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [showDateFilter, setShowDateFilter] = useState(false);
  const dateRef = useRef<HTMLDivElement>(null);

  // Multi-select
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());

  // Modals
  const [modal, setModal] = useState<"add" | "edit" | "update" | null>(null);
  const [selected, setSelected] = useState<Lead | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [updateForm, setUpdateForm] = useState(emptyUpdate);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const h = (e: MouseEvent) => { if (dateRef.current && !dateRef.current.contains(e.target as Node)) setShowDateFilter(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const load = () => fetch("/api/leads").then(r => r.json()).then(setLeads);
  useEffect(() => { load(); }, []);

  // Derived options
  const addedByOptions = useMemo(() => [...new Set(leads.map(l => l.user?.name).filter(Boolean) as string[])].sort(), [leads]);
  const sourceOptions = useMemo(() => [...new Set(leads.map(l => l.leadFrom).filter(Boolean))].sort(), [leads]);

  const activeFilterCount = filterAddedBy.length + filterSource.length + filterType.length + filterStatus.length + (filterDateFrom || filterDateTo ? 1 : 0);

  const filtered = useMemo(() => leads.filter(l => {
    if (search && ![ l.fullName, l.emailAddress, l.businessName, l.leadFrom ].some(v => v.toLowerCase().includes(search.toLowerCase()))) return false;
    if (filterAddedBy.length && (!l.user?.name || !filterAddedBy.includes(l.user.name))) return false;
    if (filterSource.length && !filterSource.includes(l.leadFrom)) return false;
    if (filterType.length && !filterType.includes(l.leadType)) return false;
    if (filterStatus.length && !filterStatus.includes(l.leadStatus)) return false;
    if (filterDateFrom && new Date(l.createdAt) < new Date(filterDateFrom)) return false;
    if (filterDateTo && new Date(l.createdAt) > new Date(filterDateTo + "T23:59:59")) return false;
    return true;
  }), [leads, search, filterAddedBy, filterSource, filterType, filterStatus, filterDateFrom, filterDateTo]);

  const clearAllFilters = () => { setSearch(""); setFilterAddedBy([]); setFilterSource([]); setFilterType([]); setFilterStatus([]); setFilterDateFrom(""); setFilterDateTo(""); };

  // Multi-select
  const allChecked = filtered.length > 0 && filtered.every(l => checkedIds.has(l.id));
  const someChecked = filtered.some(l => checkedIds.has(l.id));
  const toggleAll = () => {
    if (allChecked) { const n = new Set(checkedIds); filtered.forEach(l => n.delete(l.id)); setCheckedIds(n); }
    else { const n = new Set(checkedIds); filtered.forEach(l => n.add(l.id)); setCheckedIds(n); }
  };
  const toggleOne = (id: string) => { const n = new Set(checkedIds); n.has(id) ? n.delete(id) : n.add(id); setCheckedIds(n); };

  const bulkDelete = async () => {
    if (!confirm(`Delete ${checkedIds.size} lead(s)?`)) return;
    await Promise.all([...checkedIds].map(id => fetch(`/api/leads/${id}`, { method: "DELETE" })));
    setCheckedIds(new Set()); load();
  };

  const openAdd = () => { setForm(emptyForm); setError(""); setModal("add"); };
  const openEdit = (l: Lead) => {
    setSelected(l);
    setForm({ fullName: l.fullName, emailAddress: l.emailAddress, phoneNumber: l.phoneNumber, website: l.website ?? "", businessName: l.businessName, businessDetails: l.businessDetails, leadType: l.leadType, leadFrom: l.leadFrom, isPaid: String(l.isPaid) });
    setError(""); setModal("edit");
  };
  const openUpdate = (l: Lead) => {
    setSelected(l);
    setUpdateForm({ connection: l.connection ?? "", leadStatus: l.leadStatus, lastUpdate: l.lastUpdate ?? "" });
    setModal("update");
  };

  const save = async () => {
    setLoading(true); setError("");
    try {
      const payload = { ...form, isPaid: form.isPaid === "true" };
      const res = modal === "add"
        ? await fetch("/api/leads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
        : await fetch(`/api/leads/${selected!.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!res.ok) { const e = await res.json(); setError(e.error ?? "Error"); return; }
      await load(); setModal(null);
    } finally { setLoading(false); }
  };

  const saveUpdate = async () => {
    setLoading(true);
    try {
      await fetch(`/api/leads/${selected!.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...updateForm, connection: updateForm.connection || null }) });
      await load(); setModal(null);
    } finally { setLoading(false); }
  };

  const del = async (id: string) => {
    if (!confirm("Delete this lead?")) return;
    await fetch(`/api/leads/${id}`, { method: "DELETE" });
    setCheckedIds(prev => { const n = new Set(prev); n.delete(id); return n; });
    load();
  };

  const exportData = filtered.map(({ fullName, emailAddress, phoneNumber, website, businessName, leadType, leadFrom, isPaid, connection, leadStatus, lastUpdate, createdAt, user }) => ({
    "Full Name": fullName, "Email": emailAddress, "Phone": phoneNumber, "Website": website ?? "",
    "Business": businessName, "Lead Type": leadType, "Source": leadFrom,
    "Added By": user?.name ?? "", "Paid": isPaid ? "Yes" : "No",
    "Connection": connection ? CONNECTION_LABELS[connection] : "",
    "Status": LEAD_STATUS_LABELS[leadStatus] ?? leadStatus,
    "Last Update": lastUpdate ?? "", "Date": formatDate(createdAt),
  }));

  const inputCls = "px-3 py-1.5 text-[12px] border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400/30 text-gray-700 bg-white";

  const hotLeads = leads.filter(l => l.leadType === "HOT").length;
  const interested = leads.filter(l => l.leadStatus === "INTERESTED").length;
  const followUp = leads.filter(l => l.leadStatus === "FOLLOW_UP").length;

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard icon={Users}    label="Total Leads" value={leads.length} iconBg="bg-blue-50"    iconColor="text-blue-600" />
        <StatCard icon={Flame}    label="Hot Leads"   value={hotLeads}    iconBg="bg-red-50"     iconColor="text-red-500" />
        <StatCard icon={ThumbsUp} label="Interested"  value={interested}  iconBg="bg-emerald-50" iconColor="text-emerald-600" />
        <StatCard icon={Clock}    label="Follow Up"   value={followUp}    iconBg="bg-amber-50"   iconColor="text-amber-600" />
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search leads…"
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 text-gray-700 placeholder:text-gray-400 transition-all" />
        </div>

        <MultiSelectDropdown label="Added By" options={addedByOptions} selected={filterAddedBy} onChange={setFilterAddedBy} icon={UserCheck} />
        <MultiSelectDropdown label="Source" options={sourceOptions} selected={filterSource} onChange={setFilterSource} />
        <MultiSelectDropdown label="Type" options={LEAD_TYPES} selected={filterType} onChange={setFilterType} icon={Flame} />
        <MultiSelectDropdown
          label="Status"
          options={STATUSES}
          selected={filterStatus}
          onChange={setFilterStatus}
        />

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
          <ExportButtons data={exportData} filename="leads" />
          <button onClick={openAdd} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-[13px] font-semibold rounded-lg hover:bg-blue-700 active:scale-[0.98] transition-all">
            <Plus className="w-4 h-4" /> Add Lead
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
          <h2 className="text-[13px] font-semibold text-gray-700">{activeFilterCount > 0 ? "Filtered" : "All"} Leads</h2>
          <span className="bg-gray-100 text-gray-500 text-[11px] px-2 py-0.5 rounded-full font-semibold">{filtered.length}</span>
          {activeFilterCount > 0 && leads.length !== filtered.length && (
            <span className="text-[11px] text-gray-400">of {leads.length}</span>
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
                {["Name", "Contact", "Business", "Type", "Source", "Added By", "Status", "Last Update", "Date", ""].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={11}>
                  <div className="flex flex-col items-center justify-center py-16 gap-2">
                    <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                      <Users className="w-5 h-5 text-gray-300" />
                    </div>
                    <p className="text-[13px] font-medium text-gray-500">No leads match your filters</p>
                    <button onClick={clearAllFilters} className="text-[12px] text-blue-500 font-semibold hover:underline">Clear filters</button>
                  </div>
                </td></tr>
              ) : filtered.map(l => {
                const checked = checkedIds.has(l.id);
                return (
                  <tr key={l.id} className={`border-b border-gray-100 last:border-0 transition-colors ${checked ? "bg-blue-50/60" : "hover:bg-blue-50/30"}`}>
                    <td className="px-4 py-3.5">
                      <input type="checkbox" checked={checked} onChange={() => toggleOne(l.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={l.fullName} />
                        <p className="text-[13px] font-semibold text-gray-700 whitespace-nowrap">{l.fullName}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-[12px] text-gray-600 truncate max-w-[160px]">{l.emailAddress}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{l.phoneNumber}</p>
                    </td>
                    <td className="px-4 py-3.5 text-[13px] text-gray-600 truncate max-w-[120px]">{l.businessName}</td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${LEAD_TYPE_STYLES[l.leadType] ?? "bg-gray-100 text-gray-600"}`}>
                        {l.leadType}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-[12px] text-gray-500 whitespace-nowrap">{l.leadFrom}</td>
                    <td className="px-4 py-3.5">
                      {l.user?.name ? (
                        <div className="flex items-center gap-1.5">
                          <AvatarSm name={l.user.name} />
                          <span className="text-[12px] text-gray-500 truncate max-w-[90px]">{l.user.name}</span>
                        </div>
                      ) : <span className="text-gray-300 text-[12px]">—</span>}
                    </td>
                    <td className="px-4 py-3.5"><StatusBadge status={l.leadStatus} label={LEAD_STATUS_LABELS[l.leadStatus] ?? l.leadStatus} /></td>
                    <td className="px-4 py-3.5 text-[12px] text-gray-400 max-w-[140px] truncate">{l.lastUpdate || <span className="text-gray-300">—</span>}</td>
                    <td className="px-4 py-3.5 text-[12px] text-gray-400 whitespace-nowrap">{formatDate(l.createdAt)}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openUpdate(l)} className="px-2.5 py-1 text-[11px] font-semibold bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors whitespace-nowrap">
                          Update
                        </button>
                        <button onClick={() => openEdit(l)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors" title="Edit">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => del(l.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors" title="Delete">
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
      <Modal isOpen={modal === "add" || modal === "edit"} onClose={() => setModal(null)} title={modal === "add" ? "Add Lead" : "Edit Lead"} size="lg">
        {error && <p className="mb-3 text-sm text-red-600 bg-red-50 p-3 rounded-lg font-medium">{error}</p>}
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Full Name" required>
            <input value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} className={inputClass()} placeholder="John Doe" />
          </FormField>
          <FormField label="Email Address" required>
            <input type="email" value={form.emailAddress} onChange={e => setForm({ ...form, emailAddress: e.target.value })} className={inputClass()} placeholder="john@example.com" />
          </FormField>
          <FormField label="Phone Number" required>
            <input value={form.phoneNumber} onChange={e => setForm({ ...form, phoneNumber: e.target.value })} className={inputClass()} placeholder="+1 234 567 890" />
          </FormField>
          <FormField label="Website">
            <input value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} className={inputClass()} placeholder="https://..." />
          </FormField>
          <FormField label="Business Name" required>
            <input value={form.businessName} onChange={e => setForm({ ...form, businessName: e.target.value })} className={inputClass()} placeholder="Company name" />
          </FormField>
          <FormField label="Lead From" required>
            <input value={form.leadFrom} onChange={e => setForm({ ...form, leadFrom: e.target.value })} className={inputClass()} placeholder="LinkedIn, Facebook…" />
          </FormField>
          <FormField label="Lead Type" required>
            <select value={form.leadType} onChange={e => setForm({ ...form, leadType: e.target.value })} className={selectClass()}>
              {LEAD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </FormField>
          <FormField label="Paid or Free" required>
            <select value={form.isPaid} onChange={e => setForm({ ...form, isPaid: e.target.value })} className={selectClass()}>
              <option value="false">Free</option><option value="true">Paid</option>
            </select>
          </FormField>
          <FormField label="Business Details" className="col-span-2">
            <textarea rows={3} value={form.businessDetails} onChange={e => setForm({ ...form, businessDetails: e.target.value })} className={inputClass()} placeholder="Business description…" />
          </FormField>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={() => setModal(null)} className="px-4 py-2 text-sm font-medium border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600">Cancel</button>
          <button onClick={save} disabled={loading} className="px-5 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-all">
            {loading ? "Saving…" : "Save"}
          </button>
        </div>
      </Modal>

      {/* Update status modal */}
      <Modal isOpen={modal === "update"} onClose={() => setModal(null)} title="Update Lead Status">
        <div className="space-y-4">
          <FormField label="Connection">
            <select value={updateForm.connection} onChange={e => setUpdateForm({ ...updateForm, connection: e.target.value })} className={selectClass()}>
              <option value="">None</option>
              {CONNECTIONS.map(c => <option key={c} value={c}>{CONNECTION_LABELS[c]}</option>)}
            </select>
          </FormField>
          <FormField label="Lead Status">
            <div className="grid grid-cols-2 gap-2">
              {STATUSES.map(s => (
                <button key={s} type="button" onClick={() => setUpdateForm({ ...updateForm, leadStatus: s })}
                  className={cn("px-3 py-2 text-xs rounded-lg border transition-colors text-left", updateForm.leadStatus === s ? "border-blue-400 bg-blue-50 text-blue-700" : "border-gray-200 hover:border-gray-300")}>
                  <StatusBadge status={s} label={LEAD_STATUS_LABELS[s] ?? s} />
                </button>
              ))}
            </div>
          </FormField>
          <FormField label="Last Update">
            <textarea rows={2} value={updateForm.lastUpdate} onChange={e => setUpdateForm({ ...updateForm, lastUpdate: e.target.value })} className={inputClass()} placeholder="Update notes…" />
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
