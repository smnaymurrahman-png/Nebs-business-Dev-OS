"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useSession } from "next-auth/react";
import { Modal } from "@/components/shared/Modal";
import { FormField, inputClass, selectClass } from "@/components/shared/FormField";
import { ExportButtons } from "@/components/shared/ExportButtons";
import { formatDate } from "@/lib/utils";
import {
  Plus, Pencil, Trash2, Search, Users, Globe, Layers, UserCheck,
  ChevronDown, X, Filter, CalendarDays,
} from "lucide-react";

interface Client {
  id: string; clientId: string; name: string; email: string; phone: string;
  country: string; businessName: string; platform: string; createdAt: string;
  user?: { name: string };
}
interface TeamMember { id: string; name: string }

const empty = { name: "", email: "", phone: "", country: "", businessName: "", platform: "" };

// ── Tiny helpers ─────────────────────────────────────────────────────────────

function Avatar({ name, size = "sm" }: { name: string; size?: "sm" | "xs" }) {
  const colors = ["bg-blue-500", "bg-pink-500", "bg-emerald-500", "bg-amber-500", "bg-sky-500"];
  const color = colors[name.charCodeAt(0) % colors.length];
  const dim = size === "xs" ? "w-6 h-6 text-[9px]" : "w-7 h-7 text-[11px]";
  return (
    <div className={`${dim} rounded-md ${color} flex items-center justify-center text-white font-bold shrink-0`}>
      {name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
    </div>
  );
}

function StatCard({ label, value, icon: Icon, iconBg, iconColor }: {
  label: string; value: string | number; icon: React.ElementType; iconBg: string; iconColor: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${iconBg}`}>
        <Icon className={`w-4 h-4 ${iconColor}`} />
      </div>
      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mt-3 mb-0.5">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

// ── Multi-select dropdown ─────────────────────────────────────────────────────

function MultiSelectDropdown({
  label, options, selected, onChange, icon: Icon,
}: {
  label: string; options: string[]; selected: string[]; onChange: (v: string[]) => void;
  icon?: React.ElementType;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const toggle = (v: string) =>
    onChange(selected.includes(v) ? selected.filter(s => s !== v) : [...selected, v]);

  const active = selected.length > 0;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-1.5 px-3 py-2 text-[12px] font-semibold rounded-lg border transition-all ${
          active ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700"
        }`}
      >
        {Icon && <Icon className="w-3.5 h-3.5" />}
        {label}
        {active && <span className="ml-0.5 w-4 h-4 bg-blue-600 text-white rounded-full text-[9px] font-bold flex items-center justify-center">{selected.length}</span>}
        <ChevronDown className="w-3 h-3 opacity-50" />
      </button>

      {open && (
        <div className="absolute top-full mt-1.5 left-0 z-50 bg-white border border-gray-200 rounded-xl shadow-lg min-w-[180px] py-1.5">
          {options.length === 0 ? (
            <p className="px-3 py-2 text-xs text-gray-400">No options</p>
          ) : options.map(opt => (
            <label key={opt} className="flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={selected.includes(opt)}
                onChange={() => toggle(opt)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-[12px] text-gray-700 font-medium">{opt}</span>
            </label>
          ))}
          {active && (
            <>
              <div className="mx-2 my-1 h-px bg-gray-100" />
              <button onClick={() => { onChange([]); setOpen(false); }} className="w-full text-left px-3 py-1.5 text-[11px] text-red-500 font-semibold hover:bg-red-50">
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

export default function ClientsPage() {
  const { data: session } = useSession();
  const [clients, setClients] = useState<Client[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [selectedBdmId, setSelectedBdmId] = useState("");
  const [search, setSearch] = useState("");

  // Filters
  const [filterPlatforms, setFilterPlatforms] = useState<string[]>([]);
  const [filterAddedBy, setFilterAddedBy] = useState<string[]>([]);
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [showDateFilter, setShowDateFilter] = useState(false);
  const dateRef = useRef<HTMLDivElement>(null);

  // Multi-select
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());

  // Modal
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [selected, setSelected] = useState<Client | null>(null);
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const h = (e: MouseEvent) => { if (dateRef.current && !dateRef.current.contains(e.target as Node)) setShowDateFilter(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const load = () => fetch("/api/clients").then(r => r.json()).then(setClients);
  const loadTeam = () => fetch("/api/users").then(r => r.json()).then(setTeamMembers).catch(() => {});
  useEffect(() => { load(); loadTeam(); }, []);

  const stats = useMemo(() => {
    const now = new Date();
    return {
      total: clients.length,
      newThisMonth: clients.filter(c => { const d = new Date(c.createdAt); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); }).length,
      platforms: new Set(clients.map(c => c.platform.trim().toLowerCase())).size,
      team: new Set(clients.map(c => c.user?.name).filter(Boolean)).size,
    };
  }, [clients]);

  // Derived options for filter dropdowns
  const platformOptions = useMemo(() => [...new Set(clients.map(c => c.platform).filter(Boolean))].sort(), [clients]);
  const addedByOptions = useMemo(() => [...new Set(clients.map(c => c.user?.name).filter(Boolean) as string[])].sort(), [clients]);

  const activeFilterCount = filterPlatforms.length + filterAddedBy.length + (filterDateFrom || filterDateTo ? 1 : 0);

  const filtered = useMemo(() => clients.filter(c => {
    if (search && ![ c.name, c.email, c.clientId, c.businessName, c.country, c.platform ].some(v => v.toLowerCase().includes(search.toLowerCase()))) return false;
    if (filterPlatforms.length && !filterPlatforms.includes(c.platform)) return false;
    if (filterAddedBy.length && (!c.user?.name || !filterAddedBy.includes(c.user.name))) return false;
    if (filterDateFrom && new Date(c.createdAt) < new Date(filterDateFrom)) return false;
    if (filterDateTo && new Date(c.createdAt) > new Date(filterDateTo + "T23:59:59")) return false;
    return true;
  }), [clients, search, filterPlatforms, filterAddedBy, filterDateFrom, filterDateTo]);

  const clearAllFilters = () => { setSearch(""); setFilterPlatforms([]); setFilterAddedBy([]); setFilterDateFrom(""); setFilterDateTo(""); };

  // Multi-select helpers
  const allChecked = filtered.length > 0 && filtered.every(c => checkedIds.has(c.id));
  const someChecked = filtered.some(c => checkedIds.has(c.id));
  const toggleAll = () => {
    if (allChecked) { const next = new Set(checkedIds); filtered.forEach(c => next.delete(c.id)); setCheckedIds(next); }
    else { const next = new Set(checkedIds); filtered.forEach(c => next.add(c.id)); setCheckedIds(next); }
  };
  const toggleOne = (id: string) => {
    const next = new Set(checkedIds);
    next.has(id) ? next.delete(id) : next.add(id);
    setCheckedIds(next);
  };

  const bulkDelete = async () => {
    if (!confirm(`Delete ${checkedIds.size} client(s)?`)) return;
    await Promise.all([...checkedIds].map(id => fetch(`/api/clients/${id}`, { method: "DELETE" })));
    setCheckedIds(new Set());
    load();
  };

  const openAdd = () => { setForm(empty); setError(""); setSelectedBdmId((session?.user as { id?: string })?.id ?? ""); setModal("add"); };
  const openEdit = (c: Client) => { setSelected(c); setForm({ name: c.name, email: c.email, phone: c.phone, country: c.country, businessName: c.businessName, platform: c.platform }); setError(""); setModal("edit"); };

  const save = async () => {
    setLoading(true); setError("");
    try {
      const payload = modal === "add" ? { ...form, ...(selectedBdmId && { createdById: selectedBdmId }) } : form;
      const res = modal === "add"
        ? await fetch("/api/clients", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
        : await fetch(`/api/clients/${selected!.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) { const e = await res.json(); setError(e.error ?? "Error"); return; }
      await load(); setModal(null);
    } finally { setLoading(false); }
  };

  const del = async (id: string) => {
    if (!confirm("Delete this client?")) return;
    await fetch(`/api/clients/${id}`, { method: "DELETE" });
    setCheckedIds(prev => { const n = new Set(prev); n.delete(id); return n; });
    load();
  };

  const exportData = filtered.map(({ clientId, name, email, phone, country, businessName, platform, createdAt, user }) =>
    ({ "Client ID": clientId, Name: name, Email: email, Phone: phone, Country: country, "Business Name": businessName, Platform: platform, "Added By": user?.name ?? "", "Created At": formatDate(createdAt) })
  );

  const inputCls = "px-3 py-1.5 text-[12px] border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400/30 text-gray-700 bg-white";

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="Total Clients"    value={stats.total}        icon={Users}     iconBg="bg-blue-50"    iconColor="text-blue-600" />
        <StatCard label="New This Month"   value={stats.newThisMonth} icon={UserCheck}  iconBg="bg-emerald-50" iconColor="text-emerald-600" />
        <StatCard label="Active Platforms" value={stats.platforms}    icon={Layers}    iconBg="bg-sky-50"     iconColor="text-sky-600" />
        <StatCard label="Added by Team"    value={stats.team}         icon={Globe}     iconBg="bg-amber-50"   iconColor="text-amber-600" />
      </div>

      {/* Search + Filters + Actions */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search clients…"
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 text-gray-700 placeholder:text-gray-400 transition-all" />
        </div>

        {/* Filter: Added By */}
        <MultiSelectDropdown
          label="Added By" options={addedByOptions} selected={filterAddedBy}
          onChange={setFilterAddedBy} icon={UserCheck}
        />

        {/* Filter: Platform */}
        <MultiSelectDropdown
          label="Platform" options={platformOptions} selected={filterPlatforms}
          onChange={setFilterPlatforms} icon={Layers}
        />

        {/* Filter: Date */}
        <div className="relative" ref={dateRef}>
          <button
            onClick={() => setShowDateFilter(o => !o)}
            className={`flex items-center gap-1.5 px-3 py-2 text-[12px] font-semibold rounded-lg border transition-all ${
              filterDateFrom || filterDateTo ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700"
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            Date
            {(filterDateFrom || filterDateTo) && <span className="w-2 h-2 bg-blue-600 rounded-full" />}
            <ChevronDown className="w-3 h-3 opacity-50" />
          </button>

          {showDateFilter && (
            <div className="absolute top-full mt-1.5 left-0 z-50 bg-white border border-gray-200 rounded-xl shadow-lg p-3 min-w-[220px] space-y-2">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Date range</p>
              <div className="flex flex-col gap-2">
                <div>
                  <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">From</label>
                  <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} className={`w-full ${inputCls}`} />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">To</label>
                  <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} className={`w-full ${inputCls}`} />
                </div>
              </div>
              {(filterDateFrom || filterDateTo) && (
                <button onClick={() => { setFilterDateFrom(""); setFilterDateTo(""); }} className="text-[11px] text-red-500 font-semibold hover:text-red-600">
                  Clear dates
                </button>
              )}
            </div>
          )}
        </div>

        {/* Clear all */}
        {activeFilterCount > 0 && (
          <button onClick={clearAllFilters} className="flex items-center gap-1 px-2.5 py-2 text-[12px] font-semibold text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-all border border-transparent">
            <X className="w-3.5 h-3.5" /> Clear all
            <span className="ml-0.5 w-4 h-4 bg-red-100 text-red-500 rounded-full text-[9px] font-bold flex items-center justify-center">{activeFilterCount}</span>
          </button>
        )}

        <div className="ml-auto flex items-center gap-2 shrink-0">
          <ExportButtons data={exportData} filename="clients" />
          <button onClick={openAdd} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-[13px] font-semibold rounded-lg hover:bg-blue-700 active:scale-[0.98] transition-all">
            <Plus className="w-4 h-4" /> Add Client
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
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            {activeFilterCount > 0 && <Filter className="w-3.5 h-3.5 text-blue-500" />}
            <span className="text-[13px] font-semibold text-gray-700">
              {activeFilterCount > 0 ? "Filtered" : "All"} Clients
            </span>
            <span className="px-2 py-0.5 text-[11px] font-bold bg-gray-100 text-gray-500 rounded-full">{filtered.length}</span>
            {activeFilterCount > 0 && clients.length !== filtered.length && (
              <span className="text-[11px] text-gray-400">of {clients.length}</span>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-4 py-3 w-10">
                  <input type="checkbox" checked={allChecked} ref={el => { if (el) el.indeterminate = someChecked && !allChecked; }}
                    onChange={toggleAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                </th>
                {["Client", "Contact", "Country", "Business", "Platform", "Added By", "Date", ""].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                        <Users className="w-5 h-5 text-gray-300" />
                      </div>
                      <p className="text-[13px] font-medium text-gray-500">No clients match your filters</p>
                      <button onClick={clearAllFilters} className="text-[12px] text-blue-500 font-semibold hover:underline">Clear filters</button>
                    </div>
                  </td>
                </tr>
              ) : filtered.map((c, i) => {
                const checked = checkedIds.has(c.id);
                return (
                  <tr key={c.id}
                    className={`transition-colors border-b border-gray-100 last:border-0 ${checked ? "bg-blue-50/60" : "hover:bg-blue-50/30"}`}
                  >
                    <td className="px-4 py-3.5">
                      <input type="checkbox" checked={checked} onChange={() => toggleOne(c.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={c.name} />
                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold text-gray-800 truncate">{c.name}</p>
                          <p className="text-[11px] font-mono text-blue-500 font-medium">{c.clientId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-[12px] font-medium text-gray-600 truncate max-w-[160px]">{c.email}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{c.phone}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-1 text-[12px] text-gray-500">
                        <Globe className="w-3 h-3 text-gray-400" />{c.country}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-[13px] font-medium text-gray-600 truncate max-w-[140px]">{c.businessName}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-600 border border-gray-200">
                        {c.platform}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      {c.user?.name && (
                        <div className="flex items-center gap-2">
                          <Avatar name={c.user.name} size="xs" />
                          <span className="text-[12px] font-medium text-gray-500 truncate max-w-[100px]">{c.user.name}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <p className="text-[12px] text-gray-400">{formatDate(c.createdAt)}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(c)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all"
                          title="Edit">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => del(c.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all"
                          title="Delete">
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

      {/* Add / Edit Modal */}
      <Modal isOpen={!!modal} onClose={() => setModal(null)} title={modal === "add" ? "Add New Client" : "Edit Client"} size="lg">
        {error && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 p-3 rounded-lg font-medium">{error}</div>
        )}
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Client Name" required>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inputClass()} placeholder="John Doe" />
          </FormField>
          <FormField label="Email Address" required>
            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={inputClass()} placeholder="john@example.com" />
          </FormField>
          <FormField label="Phone Number" required>
            <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className={inputClass()} placeholder="+1 234 567 890" />
          </FormField>
          <FormField label="Country" required>
            <input value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} className={inputClass()} placeholder="United States" />
          </FormField>
          <FormField label="Business Name" required>
            <input value={form.businessName} onChange={e => setForm({ ...form, businessName: e.target.value })} className={inputClass()} placeholder="Acme Corp" />
          </FormField>
          <FormField label="Platform" required>
            <input value={form.platform} onChange={e => setForm({ ...form, platform: e.target.value })} className={inputClass()} placeholder="Upwork, Fiverr, LinkedIn…" />
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
          <button onClick={() => setModal(null)} className="px-4 py-2 text-sm font-medium border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500 transition-all">
            Cancel
          </button>
          <button onClick={save} disabled={loading} className="px-5 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 active:scale-[0.98] transition-all">
            {loading ? "Saving…" : modal === "add" ? "Add Client" : "Save Changes"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
