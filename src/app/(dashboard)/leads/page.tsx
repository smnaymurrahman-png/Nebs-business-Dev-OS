"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/shared/Modal";
import { FormField, inputClass, selectClass } from "@/components/shared/FormField";
import { ExportButtons } from "@/components/shared/ExportButtons";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatDate, LEAD_STATUS_LABELS, STATUS_COLORS } from "@/lib/utils";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
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

const emptyForm = { fullName: "", emailAddress: "", phoneNumber: "", website: "", businessName: "", businessDetails: "", leadType: "COLD", leadFrom: "", isPaid: "false" };
const emptyUpdate = { connection: "", leadStatus: "INTERESTED", lastUpdate: "" };

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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search leads..." className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400 bg-gray-50/50" />
        </div>
        <div className="flex items-center gap-2">
          <ExportButtons data={exportData} filename="leads" />
          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-semibold rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all shadow-sm">
            <Plus className="w-4 h-4" />Add Lead
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50/80 border-b border-gray-100">
              <tr>
                {["Name", "Email", "Phone", "Business", "Lead Type", "Source", "Connection", "Status", "Last Update", "Date", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-medium text-gray-600 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={11} className="px-4 py-10 text-center text-gray-400">No leads found</td></tr>
              ) : (
                filtered.map((l) => (
                  <tr key={l.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{l.fullName}</td>
                    <td className="px-4 py-3 text-gray-600">{l.emailAddress}</td>
                    <td className="px-4 py-3 text-gray-600">{l.phoneNumber}</td>
                    <td className="px-4 py-3 text-gray-600">{l.businessName}</td>
                    <td className="px-4 py-3"><StatusBadge status={l.leadType} label={l.leadType} /></td>
                    <td className="px-4 py-3 text-gray-600">{l.leadFrom}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{l.connection ? CONNECTION_LABELS[l.connection] : "-"}</td>
                    <td className="px-4 py-3"><StatusBadge status={l.leadStatus} label={LEAD_STATUS_LABELS[l.leadStatus] ?? l.leadStatus} /></td>
                    <td className="px-4 py-3 text-gray-500 text-xs max-w-[150px] truncate">{l.lastUpdate || "-"}</td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(l.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openUpdate(l)} className="px-2.5 py-1 text-xs font-semibold bg-violet-50 text-violet-600 rounded-lg hover:bg-violet-100">Update</button>
                        <button onClick={() => openEdit(l)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={() => del(l.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
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
          <button onClick={() => setModal(null)} className="px-4 py-2 text-sm font-medium border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600">Cancel</button>
          <button onClick={save} disabled={loading} className="px-4 py-2 text-sm font-semibold bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl hover:from-violet-700 hover:to-indigo-700 disabled:opacity-60 transition-all shadow-sm">
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
                  className={cn("px-3 py-2 text-xs rounded-lg border transition-colors text-left", updateForm.leadStatus === s ? "border-violet-500 bg-violet-50 text-violet-700" : "border-gray-200 hover:border-gray-300")}
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
          <button onClick={() => setModal(null)} className="px-4 py-2 text-sm font-medium border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600">Cancel</button>
          <button onClick={saveUpdate} disabled={loading} className="px-4 py-2 text-sm font-semibold bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl hover:from-violet-700 hover:to-indigo-700 disabled:opacity-60 transition-all shadow-sm">
            {loading ? "Saving..." : "Update"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
