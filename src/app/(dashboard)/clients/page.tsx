"use client";

import { useEffect, useState, useMemo } from "react";
import { Modal } from "@/components/shared/Modal";
import { FormField, inputClass } from "@/components/shared/FormField";
import { ExportButtons } from "@/components/shared/ExportButtons";
import { formatDate } from "@/lib/utils";
import { Plus, Pencil, Trash2, Search, Users, Globe, Layers, UserCheck } from "lucide-react";

interface Client {
  id: string;
  clientId: string;
  name: string;
  email: string;
  phone: string;
  country: string;
  businessName: string;
  platform: string;
  createdAt: string;
  user?: { name: string };
}

const empty = { name: "", email: "", phone: "", country: "", businessName: "", platform: "" };

/* ─── Stat Card ─────────────────────────────────────────────────── */
function StatCard({
  label, value, icon: Icon, gradient, iconBg,
}: {
  label: string; value: string | number;
  icon: React.ElementType; gradient: string; iconBg: string;
}) {
  return (
    <div className={`relative overflow-hidden bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-sm`}>
      <div className={`absolute inset-0 opacity-[0.03] ${gradient}`} />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
          <p className="text-2xl font-bold text-slate-900 leading-none">{value}</p>
        </div>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
      </div>
    </div>
  );
}

/* ─── Avatar initials ────────────────────────────────────────────── */
function Avatar({ name, size = "sm" }: { name: string; size?: "sm" | "xs" }) {
  const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const colors = [
    "from-violet-500 to-indigo-500",
    "from-pink-500 to-rose-500",
    "from-emerald-500 to-teal-500",
    "from-amber-500 to-orange-500",
    "from-sky-500 to-blue-500",
  ];
  const color = colors[name.charCodeAt(0) % colors.length];
  const dim = size === "xs" ? "w-6 h-6 text-[9px]" : "w-8 h-8 text-xs";
  return (
    <div className={`${dim} rounded-lg bg-gradient-to-br ${color} flex items-center justify-center text-white font-bold shrink-0`}>
      {initials}
    </div>
  );
}

/* ─── Platform Badge ─────────────────────────────────────────────── */
function PlatformBadge({ platform }: { platform: string }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
      {platform}
    </span>
  );
}

/* ─── Country Badge ──────────────────────────────────────────────── */
function CountryBadge({ country }: { country: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium text-slate-500">
      <Globe className="w-3 h-3 text-slate-400" />
      {country}
    </span>
  );
}

/* ─── Page ───────────────────────────────────────────────────────── */
export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [selected, setSelected] = useState<Client | null>(null);
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = () =>
    fetch("/api/clients").then((r) => r.json()).then(setClients);

  useEffect(() => { load(); }, []);

  /* Stat computations */
  const stats = useMemo(() => {
    const now = new Date();
    const newThisMonth = clients.filter((c) => {
      const d = new Date(c.createdAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
    const platforms = new Set(clients.map((c) => c.platform.trim().toLowerCase())).size;
    const team = new Set(clients.map((c) => c.user?.name).filter(Boolean)).size;
    return { total: clients.length, newThisMonth, platforms, team };
  }, [clients]);

  const filtered = clients.filter((c) =>
    [c.name, c.email, c.clientId, c.businessName, c.country, c.platform].some((v) =>
      v.toLowerCase().includes(search.toLowerCase())
    )
  );

  const openAdd = () => { setForm(empty); setError(""); setModal("add"); };
  const openEdit = (c: Client) => {
    setSelected(c);
    setForm({ name: c.name, email: c.email, phone: c.phone, country: c.country, businessName: c.businessName, platform: c.platform });
    setError("");
    setModal("edit");
  };

  const save = async () => {
    setLoading(true); setError("");
    try {
      const res = modal === "add"
        ? await fetch("/api/clients", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
        : await fetch(`/api/clients/${selected!.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) { const e = await res.json(); setError(e.error ?? "Error"); return; }
      await load(); setModal(null);
    } finally { setLoading(false); }
  };

  const del = async (id: string) => {
    if (!confirm("Delete this client?")) return;
    await fetch(`/api/clients/${id}`, { method: "DELETE" });
    load();
  };

  const exportData = filtered.map(({ clientId, name, email, phone, country, businessName, platform, createdAt }) =>
    ({ "Client ID": clientId, Name: name, Email: email, Phone: phone, Country: country, "Business Name": businessName, Platform: platform, "Created At": formatDate(createdAt) })
  );

  return (
    <div className="space-y-5">

      {/* ── Summary cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="Total Clients"    value={stats.total}        icon={Users}     gradient="bg-gradient-to-br from-violet-600 to-indigo-600" iconBg="bg-gradient-to-br from-violet-500 to-indigo-500" />
        <StatCard label="New This Month"   value={stats.newThisMonth} icon={UserCheck}  gradient="bg-gradient-to-br from-emerald-500 to-teal-500"  iconBg="bg-gradient-to-br from-emerald-500 to-teal-500" />
        <StatCard label="Active Platforms" value={stats.platforms}    icon={Layers}    gradient="bg-gradient-to-br from-sky-500 to-blue-500"       iconBg="bg-gradient-to-br from-sky-500 to-blue-500" />
        <StatCard label="Added by Team"    value={stats.team}         icon={Globe}     gradient="bg-gradient-to-br from-amber-400 to-orange-500"   iconBg="bg-gradient-to-br from-amber-400 to-orange-500" />
      </div>

      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search clients…"
            className="w-full pl-10 pr-4 py-2.5 text-sm font-medium bg-white border border-[#E2E8F0] rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-400/40 focus:border-violet-300 text-slate-700 placeholder:text-slate-400 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <ExportButtons data={exportData} filename="clients" />
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-semibold rounded-xl hover:from-violet-700 hover:to-indigo-700 shadow-md shadow-violet-200 hover:shadow-lg hover:shadow-violet-300/50 active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            Add Client
          </button>
        </div>
      </div>

      {/* ── Table card ── */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        {/* Card header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-semibold text-slate-700">All Clients</span>
            <span className="px-2 py-0.5 text-[11px] font-bold bg-violet-50 text-violet-600 rounded-full border border-violet-100">
              {filtered.length}
            </span>
          </div>
          {search && (
            <button onClick={() => setSearch("")} className="text-[11px] text-slate-400 hover:text-slate-600 font-medium">
              Clear filter
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50/80 border-b border-[#E2E8F0]">
                {[
                  { label: "Client", w: "" },
                  { label: "Contact", w: "" },
                  { label: "Country", w: "" },
                  { label: "Business", w: "" },
                  { label: "Platform", w: "" },
                  { label: "Added By", w: "" },
                  { label: "Date", w: "" },
                  { label: "", w: "w-16" },
                ].map(({ label, w }) => (
                  <th key={label} className={`px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap ${w}`}>
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
                        <Users className="w-5 h-5 text-slate-400" />
                      </div>
                      <p className="text-sm font-semibold text-slate-500">
                        {search ? "No clients match your search" : "No clients yet"}
                      </p>
                      <p className="text-xs text-slate-400">
                        {search ? "Try a different keyword" : "Add your first client to get started"}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((c, i) => (
                  <tr
                    key={c.id}
                    className={`group transition-colors hover:bg-violet-50/40 ${i !== filtered.length - 1 ? "border-b border-[#F1F5F9]" : ""}`}
                  >
                    {/* Client identity */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar name={c.name} />
                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold text-slate-800 truncate">{c.name}</p>
                          <p className="text-[11px] font-mono text-violet-500 font-medium">{c.clientId}</p>
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="px-5 py-3.5">
                      <p className="text-[12px] font-medium text-slate-600 truncate max-w-[160px]">{c.email}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{c.phone}</p>
                    </td>

                    {/* Country */}
                    <td className="px-5 py-3.5">
                      <CountryBadge country={c.country} />
                    </td>

                    {/* Business */}
                    <td className="px-5 py-3.5">
                      <p className="text-[13px] font-medium text-slate-600 truncate max-w-[140px]">{c.businessName}</p>
                    </td>

                    {/* Platform */}
                    <td className="px-5 py-3.5">
                      <PlatformBadge platform={c.platform} />
                    </td>

                    {/* Added by */}
                    <td className="px-5 py-3.5">
                      {c.user?.name && (
                        <div className="flex items-center gap-2">
                          <Avatar name={c.user.name} size="xs" />
                          <span className="text-[12px] font-medium text-slate-500 truncate">{c.user.name}</span>
                        </div>
                      )}
                    </td>

                    {/* Date */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <p className="text-[12px] font-medium text-slate-500">{formatDate(c.createdAt)}</p>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEdit(c)}
                          title="Edit"
                          className="p-1.5 rounded-lg bg-white hover:bg-violet-50 text-slate-400 hover:text-violet-600 border border-transparent hover:border-violet-100 shadow-sm transition-all"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => del(c.id)}
                          title="Delete"
                          className="p-1.5 rounded-lg bg-white hover:bg-red-50 text-slate-400 hover:text-red-500 border border-transparent hover:border-red-100 shadow-sm transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* ── Modal ── */}
      <Modal isOpen={!!modal} onClose={() => setModal(null)} title={modal === "add" ? "Add New Client" : "Edit Client"} size="lg">
        {error && (
          <div className="mb-4 flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 p-3 rounded-xl font-medium">
            {error}
          </div>
        )}
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Client Name" required>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass()} placeholder="John Doe" />
          </FormField>
          <FormField label="Email Address" required>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass()} placeholder="john@example.com" />
          </FormField>
          <FormField label="Phone Number" required>
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputClass()} placeholder="+1 234 567 890" />
          </FormField>
          <FormField label="Country" required>
            <input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className={inputClass()} placeholder="United States" />
          </FormField>
          <FormField label="Business Name" required>
            <input value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} className={inputClass()} placeholder="Acme Corp" />
          </FormField>
          <FormField label="Platform" required>
            <input value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })} className={inputClass()} placeholder="Upwork, Fiverr, LinkedIn…" />
          </FormField>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={() => setModal(null)} className="px-4 py-2 text-sm font-semibold border border-[#E2E8F0] rounded-xl hover:bg-slate-50 text-slate-500 transition-all">
            Cancel
          </button>
          <button
            onClick={save}
            disabled={loading}
            className="px-5 py-2 text-sm font-semibold bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl hover:from-violet-700 hover:to-indigo-700 disabled:opacity-60 shadow-md shadow-violet-200 active:scale-[0.98] transition-all"
          >
            {loading ? "Saving…" : modal === "add" ? "Add Client" : "Save Changes"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
