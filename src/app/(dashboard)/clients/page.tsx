"use client";

import { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { Modal } from "@/components/shared/Modal";
import { FormField, inputClass, selectClass } from "@/components/shared/FormField";
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

interface TeamMember { id: string; name: string; }

const empty = { name: "", email: "", phone: "", country: "", businessName: "", platform: "" };

function StatCard({
  label, value, icon: Icon, iconBg, iconColor,
}: {
  label: string; value: string | number;
  icon: React.ElementType; iconBg: string; iconColor: string;
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

function Avatar({ name, size = "sm" }: { name: string; size?: "sm" | "xs" }) {
  const colors = [
    "bg-blue-500", "bg-pink-500", "bg-emerald-500", "bg-amber-500", "bg-sky-500",
  ];
  const color = colors[name.charCodeAt(0) % colors.length];
  const dim = size === "xs" ? "w-6 h-6 text-[9px]" : "w-7 h-7 text-[11px]";
  return (
    <div className={`${dim} rounded-md ${color} flex items-center justify-center text-white font-bold shrink-0`}>
      {name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
    </div>
  );
}

function PlatformBadge({ platform }: { platform: string }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-600 border border-gray-200">
      {platform}
    </span>
  );
}

function CountryBadge({ country }: { country: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-[12px] text-gray-500">
      <Globe className="w-3 h-3 text-gray-400" />
      {country}
    </span>
  );
}

export default function ClientsPage() {
  const { data: session } = useSession();
  const [clients, setClients] = useState<Client[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [selectedBdmId, setSelectedBdmId] = useState("");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [selected, setSelected] = useState<Client | null>(null);
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = () =>
    fetch("/api/clients").then((r) => r.json()).then(setClients);
  const loadTeam = () => fetch("/api/users").then((r) => r.json()).then(setTeamMembers).catch(() => {});

  useEffect(() => { load(); loadTeam(); }, []);

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

  const openAdd = () => {
    setForm(empty);
    setError("");
    setSelectedBdmId((session?.user as { id?: string })?.id ?? "");
    setModal("add");
  };
  const openEdit = (c: Client) => {
    setSelected(c);
    setForm({ name: c.name, email: c.email, phone: c.phone, country: c.country, businessName: c.businessName, platform: c.platform });
    setError("");
    setModal("edit");
  };

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
    load();
  };

  const exportData = filtered.map(({ clientId, name, email, phone, country, businessName, platform, createdAt }) =>
    ({ "Client ID": clientId, Name: name, Email: email, Phone: phone, Country: country, "Business Name": businessName, Platform: platform, "Created At": formatDate(createdAt) })
  );

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="Total Clients"    value={stats.total}        icon={Users}     iconBg="bg-blue-50"    iconColor="text-blue-600" />
        <StatCard label="New This Month"   value={stats.newThisMonth} icon={UserCheck}  iconBg="bg-emerald-50" iconColor="text-emerald-600" />
        <StatCard label="Active Platforms" value={stats.platforms}    icon={Layers}    iconBg="bg-sky-50"     iconColor="text-sky-600" />
        <StatCard label="Added by Team"    value={stats.team}         icon={Globe}     iconBg="bg-amber-50"   iconColor="text-amber-600" />
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search clients…"
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 text-gray-700 placeholder:text-gray-400 transition-all"
          />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <ExportButtons data={exportData} filename="clients" />
          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-[13px] font-semibold rounded-lg hover:bg-blue-700 active:scale-[0.98] transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Client
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-semibold text-gray-700">All Clients</span>
            <span className="px-2 py-0.5 text-[11px] font-bold bg-gray-100 text-gray-500 rounded-full">
              {filtered.length}
            </span>
          </div>
          {search && (
            <button onClick={() => setSearch("")} className="text-[11px] text-gray-400 hover:text-gray-600 font-medium">
              Clear filter
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {["Client", "Contact", "Country", "Business", "Platform", "Added By", "Date", ""].map((label) => (
                  <th key={label} className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                        <Users className="w-5 h-5 text-gray-300" />
                      </div>
                      <p className="text-[13px] font-medium text-gray-500">
                        {search ? "No clients match your search" : "No clients yet"}
                      </p>
                      <p className="text-[12px] text-gray-400">
                        {search ? "Try a different keyword" : "Add your first client to get started"}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((c, i) => (
                  <tr
                    key={c.id}
                    className={`group transition-colors hover:bg-blue-50/40 ${i !== filtered.length - 1 ? "border-b border-gray-100" : ""}`}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={c.name} />
                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold text-gray-800 truncate">{c.name}</p>
                          <p className="text-[11px] font-mono text-blue-500 font-medium">{c.clientId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-[12px] font-medium text-gray-600 truncate max-w-[160px]">{c.email}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{c.phone}</p>
                    </td>
                    <td className="px-5 py-3.5"><CountryBadge country={c.country} /></td>
                    <td className="px-5 py-3.5">
                      <p className="text-[13px] font-medium text-gray-600 truncate max-w-[140px]">{c.businessName}</p>
                    </td>
                    <td className="px-5 py-3.5"><PlatformBadge platform={c.platform} /></td>
                    <td className="px-5 py-3.5">
                      {c.user?.name && (
                        <div className="flex items-center gap-2">
                          <Avatar name={c.user.name} size="xs" />
                          <span className="text-[12px] font-medium text-gray-500 truncate">{c.user.name}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <p className="text-[12px] text-gray-400">{formatDate(c.createdAt)}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => del(c.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all">
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

      <Modal isOpen={!!modal} onClose={() => setModal(null)} title={modal === "add" ? "Add New Client" : "Edit Client"} size="lg">
        {error && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 p-3 rounded-lg font-medium">
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
          {modal === "add" && teamMembers.length > 0 && (
            <FormField label="Added By (BDM)" className="col-span-2">
              <select value={selectedBdmId} onChange={(e) => setSelectedBdmId(e.target.value)} className={selectClass()}>
                <option value="">— Select team member —</option>
                {teamMembers.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
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
