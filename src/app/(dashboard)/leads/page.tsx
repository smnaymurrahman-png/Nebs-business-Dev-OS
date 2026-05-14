"use client";

import { useEffect, useState } from "react";
import { type ComponentType } from "react";
import { Modal } from "@/components/shared/Modal";
import { FormField, inputClass, selectClass } from "@/components/shared/FormField";
import { ExportButtons } from "@/components/shared/ExportButtons";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatDate, LEAD_STATUS_LABELS, STATUS_COLORS } from "@/lib/utils";
import { Plus, Pencil, Trash2, Search, Users, Flame, ThumbsUp, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface Lead {
  id: string;
  fullName: string;
  emailAddress: string;
  phoneNumber: string;
  website?: string;
  businessName: string;
  businessDetails: string;
  leadType: string;
  leadFrom: string;
  isPaid: boolean;
  connection?: string;
  leadStatus: string;
  lastUpdate?: string;
  createdAt: string;
  user?: { name: string };
}

const LEAD_TYPES = ["COLD", "HOT", "WARM"];
const CONNECTIONS = ["BY_PHONE", "BY_EMAIL", "BY_WHATSAPP"];
const STATUSES = ["INTERESTED", "NOT_INTERESTED", "NO_RESPONSE", "FOLLOW_UP", "PENDING_DECISION"];
const CONNECTION_LABELS: Record<string, string> = { BY_PHONE: "By Phone", BY_EMAIL: "By Email", BY_WHATSAPP: "By WhatsApp" };
const LEAD_TYPE_STYLES: Record<string, string> = {
  HOT: "bg-red-50 text-red-700 ring-1 ring-red-100",
  WARM: "bg-orange-50 text-orange-700 ring-1 ring-orange-100",
  COLD: "bg-blue-50 text-blue-700 ring-1 ring-blue-100",
};

const emptyForm = { fullName: "", emailAddress: "", phoneNumber: "", website: "", businessName: "", businessDetails: "", leadType: "COLD", leadFrom: "", isPaid: "false" };
const emptyUpdate = { connection: "", leadStatus: "INTERESTED", lastUpdate: "" };

const AVATAR_COLORS = ["from-violet-500 to-purple-600", "from-indigo-500 to-blue-600", "from-emerald-500 to-teal-600", "from-orange-500 to-red-500", "from-pink-500 to-rose-600"];

function Avatar({ name }: { name: string }) {
  const color = AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
  return (
    <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
      {name[0]?.toUpperCase()}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, iconBg, iconColor }: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-5">
      <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-3">{label}</p>
      <p className="text-2xl font-bold text-slate-800 mt-0.5">{value}</p>
    </div>
  );
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<"add" | "edit" | "update" | null>(null);
  const [selected, setSelected] = useState<Lead | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [updateForm, setUpdateForm] = useState(emptyUpdate);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = () => fetch("/api/leads").then((r) => r.json()).then(setLeads);
  useEffect(() => { load(); }, []);

  const filtered = leads.filter((l) =>
    [l.fullName, l.emailAddress, l.businessName].some((v) => v.toLowerCase().includes(search.toLowerCase()))
  );

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
      const payload = { ...updateForm, connection: updateForm.connection || null };
      await fetch(`/api/leads/${selected!.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      await load(); setModal(null);
    } finally { setLoading(false); }
  };

  const del = async (id: string) => {
    if (!confirm("Delete this lead?")) return;
    await fetch(`/api/leads/${id}`, { method: "DELETE" });
    load();
  };

  const exportData = filtered.map(({ fullName, emailAddress, phoneNumber, website, businessName, leadType, leadFrom, isPaid, connection, leadStatus, lastUpdate, createdAt }) => ({
    "Full Name": fullName, "Email": emailAddress, "Phone": phoneNumber, "Website": website,
    "Business": businessName, "Lead Type": leadType, "Lead From": leadFrom,
    "Paid": isPaid ? "Yes" : "No", "Connection": connection ? CONNECTION_LABELS[connection] : "",
    "Status": LEAD_STATUS_LABELS[leadStatus], "Last Update": lastUpdate, "Date": formatDate(createdAt),
  }));

  const hotLeads = leads.filter((l) => l.leadType === "HOT").length;
  const interested = leads.filter((l) => l.leadStatus === "INTERESTED").length;
  const followUp = leads.filter((l) => l.leadStatus === "FOLLOW_UP").length;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Leads" value={leads.length} iconBg="bg-gradient-to-br from-violet-50 to-violet-100" iconColor="text-violet-600" />
        <StatCard icon={Flame} label="Hot Leads" value={hotLeads} iconBg="bg-gradient-to-br from-red-50 to-orange-50" iconColor="text-red-500" />
        <StatCard icon={ThumbsUp} label="Interested" value={interested} iconBg="bg-gradient-to-br from-emerald-50 to-emerald-100" iconColor="text-emerald-600" />
        <StatCard icon={Clock} label="Follow Up" value={followUp} iconBg="bg-gradient-to-br from-amber-50 to-amber-100" iconColor="text-amber-600" />
      </div>

      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-[#F1F5F9] flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <h2 className="text-[13px] font-semibold text-slate-700">All Leads</h2>
            <span className="bg-slate-100 text-slate-600 text-[11px] px-2 py-0.5 rounded-full font-semibold">{filtered.length}</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search leads..." className="pl-8 pr-3 py-2 text-[13px] font-medium border border-[#E2E8F0] rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400/40 focus:border-violet-300 bg-white placeholder:text-slate-300 text-slate-700 shadow-sm w-52 transition-all" />
            </div>
            <ExportButtons data={exportData} filename="leads" />
            <button onClick={openAdd} className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-[13px] font-semibold rounded-xl hover:from-violet-700 hover:to-indigo-700 shadow-md shadow-violet-200 hover:shadow-lg hover:shadow-violet-300/50 active:scale-[0.98] transition-all">
              <Plus className="w-4 h-4" />Add Lead
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#F8FAFC] border-b border-[#F1F5F9]">
              <tr>
                {["Name", "Email", "Phone", "Business", "Lead Type", "Source", "Connection", "Status", "Last Update", "Date", ""].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={11}>
                  <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                      <Users className="w-6 h-6 text-slate-300" />
                    </div>
                    <p className="text-sm font-medium text-slate-500">No leads yet</p>
                    <p className="text-xs mt-1">Add your first lead to get started</p>
                  </div>
                </td></tr>
              ) : (
                filtered.map((l) => (
                  <tr key={l.id} className="group border-b border-[#F1F5F9] hover:bg-violet-50/40 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={l.fullName} />
                        <p className="text-[13px] font-semibold text-slate-700">{l.fullName}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-[13px] text-slate-500">{l.emailAddress}</td>
                    <td className="px-5 py-3.5 text-[13px] text-slate-500">{l.phoneNumber}</td>
                    <td className="px-5 py-3.5 text-[13px] text-slate-600">{l.businessName}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-[11px] font-semibold ${LEAD_TYPE_STYLES[l.leadType] ?? "bg-slate-100 text-slate-600"}`}>
                        {l.leadType}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-[13px] text-slate-500">{l.leadFrom}</td>
                    <td className="px-5 py-3.5 text-[12px] text-slate-500">{l.connection ? CONNECTION_LABELS[l.connection] : <span className="text-slate-300">—</span>}</td>
                    <td className="px-5 py-3.5"><StatusBadge status={l.leadStatus} label={LEAD_STATUS_LABELS[l.leadStatus] ?? l.leadStatus} /></td>
                    <td className="px-5 py-3.5 text-[12px] text-slate-400 max-w-[150px] truncate">{l.lastUpdate || <span className="text-slate-300">—</span>}</td>
                    <td className="px-5 py-3.5 text-[12px] text-slate-400 whitespace-nowrap">{formatDate(l.createdAt)}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openUpdate(l)} className="px-2.5 py-1 text-[11px] font-semibold bg-violet-50 text-violet-600 rounded-lg hover:bg-violet-100 transition-colors">Update</button>
                        <button onClick={() => openEdit(l)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={() => del(l.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={modal === "add" || modal === "edit"} onClose={() => setModal(null)} title={modal === "add" ? "Add Lead" : "Edit Lead"} size="lg">
        {error && <p className="mb-3 text-sm text-red-600 bg-red-50 p-3 rounded-xl font-medium">{error}</p>}
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Full Name" required>
            <input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className={inputClass()} placeholder="John Doe" />
          </FormField>
          <FormField label="Email Address" required>
            <input type="email" value={form.emailAddress} onChange={(e) => setForm({ ...form, emailAddress: e.target.value })} className={inputClass()} placeholder="john@example.com" />
          </FormField>
          <FormField label="Phone Number" required>
            <input value={form.phoneNumber} onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} className={inputClass()} placeholder="+1 234 567 890" />
          </FormField>
          <FormField label="Website">
            <input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} className={inputClass()} placeholder="https://..." />
          </FormField>
          <FormField label="Business Name" required>
            <input value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} className={inputClass()} placeholder="Company name" />
          </FormField>
          <FormField label="Lead From" required>
            <input value={form.leadFrom} onChange={(e) => setForm({ ...form, leadFrom: e.target.value })} className={inputClass()} placeholder="LinkedIn, Facebook..." />
          </FormField>
          <FormField label="Lead Type" required>
            <select value={form.leadType} onChange={(e) => setForm({ ...form, leadType: e.target.value })} className={selectClass()}>
              {LEAD_TYPES.map((t) => (<option key={t} value={t}>{t}</option>))}
            </select>
          </FormField>
          <FormField label="Paid or Free" required>
            <select value={form.isPaid} onChange={(e) => setForm({ ...form, isPaid: e.target.value })} className={selectClass()}>
              <option value="false">Free</option><option value="true">Paid</option>
            </select>
          </FormField>
          <FormField label="Business Details" className="col-span-2">
            <textarea rows={3} value={form.businessDetails} onChange={(e) => setForm({ ...form, businessDetails: e.target.value })} className={inputClass()} placeholder="Business description..." />
          </FormField>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={() => setModal(null)} className="px-4 py-2 text-sm font-medium border border-[#E2E8F0] rounded-xl hover:bg-slate-50 text-slate-600">Cancel</button>
          <button onClick={save} disabled={loading} className="px-5 py-2 text-sm font-semibold bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl hover:from-violet-700 hover:to-indigo-700 disabled:opacity-60 transition-all shadow-sm shadow-violet-200">
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </Modal>

      <Modal isOpen={modal === "update"} onClose={() => setModal(null)} title="Update Lead Status">
        <div className="space-y-4">
          <FormField label="Connection">
            <select value={updateForm.connection} onChange={(e) => setUpdateForm({ ...updateForm, connection: e.target.value })} className={selectClass()}>
              <option value="">None</option>
              {CONNECTIONS.map((c) => (<option key={c} value={c}>{CONNECTION_LABELS[c]}</option>))}
            </select>
          </FormField>
          <FormField label="Lead Status">
            <div className="grid grid-cols-2 gap-2">
              {STATUSES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setUpdateForm({ ...updateForm, leadStatus: s })}
                  className={cn("px-3 py-2 text-xs rounded-xl border transition-colors text-left", updateForm.leadStatus === s ? "border-violet-400 bg-violet-50 text-violet-700" : "border-[#E2E8F0] hover:border-slate-300")}
                >
                  <StatusBadge status={s} label={LEAD_STATUS_LABELS[s] ?? s} />
                </button>
              ))}
            </div>
          </FormField>
          <FormField label="Last Update">
            <textarea rows={2} value={updateForm.lastUpdate} onChange={(e) => setUpdateForm({ ...updateForm, lastUpdate: e.target.value })} className={inputClass()} placeholder="Update notes..." />
          </FormField>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={() => setModal(null)} className="px-4 py-2 text-sm font-medium border border-[#E2E8F0] rounded-xl hover:bg-slate-50 text-slate-600">Cancel</button>
          <button onClick={saveUpdate} disabled={loading} className="px-5 py-2 text-sm font-semibold bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl hover:from-violet-700 hover:to-indigo-700 disabled:opacity-60 transition-all shadow-sm shadow-violet-200">
            {loading ? "Saving..." : "Update"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
