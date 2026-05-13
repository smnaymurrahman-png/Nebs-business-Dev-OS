"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/shared/Modal";
import { FormField, inputClass, selectClass } from "@/components/shared/FormField";
import { ExportButtons } from "@/components/shared/ExportButtons";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatCurrency, formatDate, PROPOSAL_STATUS_LABELS, SERVICE_TYPE_LABELS } from "@/lib/utils";
import { Plus, Pencil, Trash2, Search } from "lucide-react";

interface Proposal {
  id: string;
  platform: string;
  projectName: string;
  projectDetails: string;
  amount: number;
  proposal: string;
  messageToClient: string;
  connectIn: number;
  costing: number;
  serviceType: string;
  currentStatus: string;
  followUp: number;
  remark?: string;
  createdAt: string;
  client: {
    id: string;
    clientId: string;
    name: string;
    email: string;
    phone: string;
    country: string;
    businessName: string;
    platform: string;
  };
}

interface Client {
  id: string;
  clientId: string;
  name: string;
  email: string;
  phone: string;
  country: string;
  businessName: string;
  platform: string;
}

const SERVICE_TYPES = ["WORDPRESS", "FULL_STACK", "UI_UX", "WEBFLOW", "SHOPIFY", "DIGITAL_MARKETING", "OTHER"];
const STATUSES = ["PROPOSAL_SENT", "COMMUNICATION_RUNNING", "PAYMENT_PENDING", "PROPOSAL_REJECTED", "ORDER_COMPLETED"];

const emptyForm = {
  clientId: "", platform: "", projectName: "", projectDetails: "", amount: "",
  proposal: "", messageToClient: "", connectIn: "", costing: "", serviceType: "WORDPRESS",
};

export default function ProposalsPage() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<"add" | "edit" | "update" | null>(null);
  const [selected, setSelected] = useState<Proposal | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [updateForm, setUpdateForm] = useState({ currentStatus: "", followUp: "0", remark: "" });
  const [clientInfo, setClientInfo] = useState<Client | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = () => fetch("/api/proposals").then((r) => r.json()).then(setProposals);
  useEffect(() => { load(); }, []);

  const filtered = proposals.filter((p) =>
    [p.projectName, p.client.name, p.client.clientId, p.platform].some((v) =>
      v.toLowerCase().includes(search.toLowerCase())
    )
  );

  const lookupClient = async (clientId: string) => {
    if (!clientId) return;
    const res = await fetch(`/api/clients/lookup?clientId=${clientId}`);
    if (res.ok) setClientInfo(await res.json());
    else setClientInfo(null);
  };

  const openAdd = () => { setForm(emptyForm); setClientInfo(null); setError(""); setModal("add"); };
  const openEdit = (p: Proposal) => {
    setSelected(p);
    setForm({
      clientId: p.client.clientId, platform: p.platform, projectName: p.projectName,
      projectDetails: p.projectDetails, amount: String(p.amount), proposal: p.proposal,
      messageToClient: p.messageToClient, connectIn: String(p.connectIn),
      costing: String(p.costing), serviceType: p.serviceType,
    });
    setClientInfo(p.client);
    setError("");
    setModal("edit");
  };
  const openUpdate = (p: Proposal) => {
    setSelected(p);
    setUpdateForm({ currentStatus: p.currentStatus, followUp: String(p.followUp), remark: p.remark ?? "" });
    setModal("update");
  };

  const save = async () => {
    setLoading(true); setError("");
    try {
      const res = modal === "add"
        ? await fetch("/api/proposals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
        : await fetch(`/api/proposals/${selected!.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) { const e = await res.json(); setError(e.error ?? "Error"); return; }
      await load(); setModal(null);
    } finally { setLoading(false); }
  };

  const saveUpdate = async () => {
    setLoading(true);
    try {
      await fetch(`/api/proposals/${selected!.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updateForm) });
      await load(); setModal(null);
    } finally { setLoading(false); }
  };

  const del = async (id: string) => {
    if (!confirm("Delete this proposal?")) return;
    await fetch(`/api/proposals/${id}`, { method: "DELETE" });
    load();
  };

  const exportData = filtered.map((p) => ({
    "Client ID": p.client.clientId, "Client Name": p.client.name, "Platform": p.platform,
    "Project Name": p.projectName, "Amount": p.amount, "Costing": p.costing,
    "Service Type": SERVICE_TYPE_LABELS[p.serviceType], "Status": PROPOSAL_STATUS_LABELS[p.currentStatus],
    "Follow Up": p.followUp, "Remark": p.remark ?? "", "Date": formatDate(p.createdAt),
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search proposals..." className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400 bg-gray-50/50" />
        </div>
        <div className="flex items-center gap-2">
          <ExportButtons data={exportData} filename="proposals" />
          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-semibold rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all shadow-sm">
            <Plus className="w-4 h-4" />Add Proposal
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50/80 border-b border-gray-100">
              <tr>
                {["Client", "Project", "Platform", "Service", "Amount", "Costing", "Status", "Follow Up", "Date", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-medium text-gray-600 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={10} className="px-4 py-10 text-center text-gray-400">No proposals found</td></tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium">{p.client.name}</p>
                      <p className="text-xs text-gray-500 font-mono">{p.client.clientId}</p>
                    </td>
                    <td className="px-4 py-3 font-medium">{p.projectName}</td>
                    <td className="px-4 py-3 text-gray-600">{p.platform}</td>
                    <td className="px-4 py-3 text-gray-600">{SERVICE_TYPE_LABELS[p.serviceType]}</td>
                    <td className="px-4 py-3 font-semibold">{formatCurrency(p.amount)}</td>
                    <td className="px-4 py-3 text-gray-600">{formatCurrency(p.costing)}</td>
                    <td className="px-4 py-3"><StatusBadge status={p.currentStatus} label={PROPOSAL_STATUS_LABELS[p.currentStatus] ?? p.currentStatus} /></td>
                    <td className="px-4 py-3 text-center">{p.followUp > 0 ? `FU ${p.followUp}` : "-"}</td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(p.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openUpdate(p)} className="px-2.5 py-1 text-xs font-semibold bg-violet-50 text-violet-600 rounded-lg hover:bg-violet-100">Update</button>
                        <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={() => del(p.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal isOpen={modal === "add" || modal === "edit"} onClose={() => setModal(null)} title={modal === "add" ? "Add Proposal" : "Edit Proposal"} size="xl">
        {error && <p className="mb-3 text-sm text-red-600 bg-red-50 p-3 rounded-xl font-medium">{error}</p>}
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Client ID" required>
            <div className="flex gap-2">
              <input value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })} className={inputClass()} placeholder="CLT-XXXX-XXXX" />
              <button onClick={() => lookupClient(form.clientId)} className="px-3 py-2 text-xs font-semibold bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl whitespace-nowrap">Lookup</button>
            </div>
          </FormField>
          {clientInfo && (
            <div className="bg-violet-50 rounded-xl p-3 text-xs text-violet-800 col-span-1">
              <p><strong>{clientInfo.name}</strong> · {clientInfo.email}</p>
              <p>{clientInfo.businessName} · {clientInfo.country}</p>
            </div>
          )}
          <FormField label="Platform" required>
            <input value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })} className={inputClass()} placeholder="Upwork, Fiverr..." />
          </FormField>
          <FormField label="Project Name" required>
            <input value={form.projectName} onChange={(e) => setForm({ ...form, projectName: e.target.value })} className={inputClass()} placeholder="Project title" />
          </FormField>
          <FormField label="Service Type" required>
            <select value={form.serviceType} onChange={(e) => setForm({ ...form, serviceType: e.target.value })} className={selectClass()}>
              {SERVICE_TYPES.map((s) => (<option key={s} value={s}>{SERVICE_TYPE_LABELS[s]}</option>))}
            </select>
          </FormField>
          <FormField label="Amount (USD)" required>
            <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className={inputClass()} placeholder="0.00" />
          </FormField>
          <FormField label="Costing (USD)" required>
            <input type="number" value={form.costing} onChange={(e) => setForm({ ...form, costing: e.target.value })} className={inputClass()} placeholder="0.00" />
          </FormField>
          <FormField label="Connect In (number)" required>
            <input type="number" value={form.connectIn} onChange={(e) => setForm({ ...form, connectIn: e.target.value })} className={inputClass()} placeholder="0" />
          </FormField>
          <FormField label="Project Details" className="col-span-2">
            <textarea rows={3} value={form.projectDetails} onChange={(e) => setForm({ ...form, projectDetails: e.target.value })} className={inputClass()} placeholder="Project description..." />
          </FormField>
          <FormField label="Proposal" className="col-span-2">
            <textarea rows={3} value={form.proposal} onChange={(e) => setForm({ ...form, proposal: e.target.value })} className={inputClass()} placeholder="Proposal content..." />
          </FormField>
          <FormField label="Message to Client" className="col-span-2">
            <textarea rows={2} value={form.messageToClient} onChange={(e) => setForm({ ...form, messageToClient: e.target.value })} className={inputClass()} placeholder="Message..." />
          </FormField>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={() => setModal(null)} className="px-4 py-2 text-sm font-medium border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600">Cancel</button>
          <button onClick={save} disabled={loading} className="px-4 py-2 text-sm font-semibold bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl hover:from-violet-700 hover:to-indigo-700 disabled:opacity-60 transition-all shadow-sm">
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </Modal>

      {/* Update Status Modal */}
      <Modal isOpen={modal === "update"} onClose={() => setModal(null)} title="Update Proposal Status">
        <div className="space-y-4">
          <FormField label="Current Status">
            <select value={updateForm.currentStatus} onChange={(e) => setUpdateForm({ ...updateForm, currentStatus: e.target.value })} className={selectClass()}>
              {STATUSES.map((s) => (<option key={s} value={s}>{PROPOSAL_STATUS_LABELS[s]}</option>))}
            </select>
          </FormField>
          <FormField label="Follow Up">
            <select value={updateForm.followUp} onChange={(e) => setUpdateForm({ ...updateForm, followUp: e.target.value })} className={selectClass()}>
              {[0, 1, 2, 3, 4, 5].map((n) => (<option key={n} value={n}>{n === 0 ? "None" : `Follow Up ${n}`}</option>))}
            </select>
          </FormField>
          <FormField label="Remark">
            <textarea rows={3} value={updateForm.remark} onChange={(e) => setUpdateForm({ ...updateForm, remark: e.target.value })} className={inputClass()} placeholder="Add a remark..." />
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
