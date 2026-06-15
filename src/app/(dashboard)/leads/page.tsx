"use client";

import { useEffect, useState } from "react";
import { type ComponentType } from "react";
import { Modal } from "@/components/shared/Modal";
import { FormField, inputClass, selectClass } from "@/components/shared/FormField";
import { ExportButtons } from "@/components/shared/ExportButtons";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatDate, LEAD_STATUS_LABELS } from "@/lib/utils";
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
  COLD: "bg-sky-50 text-sky-700 ring-1 ring-sky-100",
};

const emptyForm = { fullName: "", emailAddress: "", phoneNumber: "", website: "", businessName: "", businessDetails: "", leadType: "COLD", leadFrom: "", isPaid: "false" };
const emptyUpdate = { connection: "", leadStatus: "INTERESTED", lastUpdate: "" };

const AVATAR_COLORS = ["bg-blue-500", "bg-indigo-500", "bg-emerald-500", "bg-orange-500", "bg-pink-500"];

function Avatar({ name }: { name: string }) {
  const color = AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
  return (
    <div className={`w-7 h-7 rounded-md ${color} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
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
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className={`w-9 h-9 rounded-lg ${iconBg} flex items-center justify-center`}>
        <Icon className={`w-4 h-4 ${iconColor}`} />
      </div>
      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mt-3">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard icon={Users}    label="Total Leads" value={leads.length} iconBg="bg-blue-50"    iconColor="text-blue-600" />
        <StatCard icon={Flame}    label="Hot Leads"   value={hotLeads}    iconBg="bg-red-50"     iconColor="text-red-500" />
        <StatCard icon={ThumbsUp} label="Interested"  value={interested}  iconBg="bg-emerald-50" iconColor="text-emerald-600" />
        <StatCard icon={Clock}    label="Follow Up"   value={followUp}    iconBg="bg-amber-50"   iconColor="text-amber-600" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <h2 className="text-[13px] font-semibold text-gray-700">All Leads</h2>
            <span className="bg-gray-100 text-gray-500 text-[11px] px-2 py-0.5 rounded-full font-semibold">{filtered.length}</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search leads..." className="pl-8 pr-3 py-2 text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 bg-white placeholder:text-gray-300 text-gray-700 w-52 transition-all" />
            </div>
            <ExportButtons data={exportData} filename="leads" />
            <button onClick={openAdd} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-[13px] font-semibold rounded-lg hover:bg-blue-700 active:scale-[0.98] transition-all">
              <Plus className="w-4 h-4" />Add Lead
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Name", "Email", "Phone", "Business", "Lead Type", "Source", "Connection", "Status", "Last Update", "Date", ""].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={11}>
                  <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                    <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-3">
                      <Users className="w-5 h-5 text-gray-300" />
                    </div>
                    <p className="text-[13px] font-medium text-gray-500">No leads yet</p>
                    <p className="text-[12px] mt-1">Add your first lead to get started</p>
                  </div>
                </td></tr>
              ) : (
                filtered.map((l) => (
                  <tr key={l.id} className="group border-b border-gray-100 hover:bg-blue-50/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={l.fullName} />
                        <p className="text-[13px] font-semibold text-gray-700">{l.fullName}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-[13px] text-gray-500">{l.emailAddress}</td>
                    <td className="px-5 py-3.5 text-[13px] text-gray-500">{l.phoneNumber}</td>
                    <td className="px-5 py-3.5 text-[13px] text-gray-600">{l.businessName}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${LEAD_TYPE_STYLES[l.leadType] ?? "bg-gray-100 text-gray-600"}`}>
                        {l.leadType}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-[13px] text-gray-500">{l.leadFrom}</td>
                    <td className="px-5 py-3.5 text-[12px] text-gray-500">{l.connection ? CONNECTION_LABELS[l.connection] : <span className="text-gray-300">—</span>}</td>
                    <td className="px-5 py-3.5"><StatusBadge status={l.leadStatus} label={LEAD_STATUS_LABELS[l.leadStatus] ?? l.leadStatus} /></td>
                    <td className="px-5 py-3.5 text-[12px] text-gray-400 max-w-[150px] truncate">{l.lastUpdate || <span className="text-gray-300">—</span>}</td>
                    <td className="px-5 py-3.5 text-[12px] text-gray-400 whitespace-nowrap">{formatDate(l.createdAt)}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openUpdate(l)} className="px-2.5 py-1 text-[11px] font-semibold bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors">Update</button>
                        <button onClick={() => openEdit(l)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={() => del(l.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
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
        {error && <p className="mb-3 text-sm text-red-600 bg-red-50 p-3 rounded-lg font-medium">{error}</p>}
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
          <button onClick={() => setModal(null)} className="px-4 py-2 text-sm font-medium border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600">Cancel</button>
          <button onClick={save} disabled={loading} className="px-5 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-all">
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
                  className={cn("px-3 py-2 text-xs rounded-lg border transition-colors text-left", updateForm.leadStatus === s ? "border-blue-400 bg-blue-50 text-blue-700" : "border-gray-200 hover:border-gray-300")}
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
          <button onClick={() => setModal(null)} className="px-4 py-2 text-sm font-medium border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600">Cancel</button>
          <button onClick={saveUpdate} disabled={loading} className="px-5 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-all">
            {loading ? "Saving..." : "Update"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
