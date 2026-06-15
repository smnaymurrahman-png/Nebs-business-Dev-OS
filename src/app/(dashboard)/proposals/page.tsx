"use client";

import { useEffect, useState } from "react";
import { type ComponentType } from "react";
import { useSession } from "next-auth/react";
import { Modal } from "@/components/shared/Modal";
import { FormField, inputClass, selectClass } from "@/components/shared/FormField";
import { ExportButtons } from "@/components/shared/ExportButtons";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatCurrency, formatDate, PROPOSAL_STATUS_LABELS, SERVICE_TYPE_LABELS } from "@/lib/utils";
import { Plus, Pencil, Trash2, Search, FileText, Send, CheckCircle, DollarSign } from "lucide-react";

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
  user?: { name: string };
}

interface TeamMember {
  id: string;
  name: string;
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

export default function ProposalsPage() {
  const { data: session } = useSession();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [selectedBdmId, setSelectedBdmId] = useState("");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<"add" | "edit" | "update" | null>(null);
  const [selected, setSelected] = useState<Proposal | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [updateForm, setUpdateForm] = useState({ currentStatus: "", followUp: "0", remark: "" });
  const [clientInfo, setClientInfo] = useState<Client | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [updateError, setUpdateError] = useState("");

  const load = () => fetch("/api/proposals").then((r) => r.json()).then(setProposals);
  const loadTeam = () => fetch("/api/users").then((r) => r.json()).then(setTeamMembers).catch(() => {});
  useEffect(() => { load(); loadTeam(); }, []);

  const filtered = proposals.filter((p) =>
    [p.projectName, p.client.name, p.client.clientId, p.platform].some((v) =>
      v.toLowerCase().includes(search.toLowerCase())
    )
  );

  const lookupClient = async (clientId: string) => {
    if (!clientId) return;
    const res = await fetch(`/api/clients/lookup?clientId=${clientId}`);
    if (res.ok) {
      const client = await res.json();
      setClientInfo(client);
      setForm((f) => ({ ...f, platform: client.platform }));
    } else setClientInfo(null);
  };

  const openAdd = () => {
    setForm(emptyForm);
    setClientInfo(null);
    setError("");
    setSelectedBdmId((session?.user as { id?: string })?.id ?? "");
    setModal("add");
  };
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
      const res = await fetch(`/api/proposals/${selected!.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateForm),
      });
      if (!res.ok) { const e = await res.json(); setUpdateError(e.error ?? "Update failed"); return; }
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

  const sent = proposals.filter((p) => p.currentStatus === "PROPOSAL_SENT").length;
  const completed = proposals.filter((p) => p.currentStatus === "ORDER_COMPLETED").length;
  const revenue = proposals.filter((p) => p.currentStatus === "ORDER_COMPLETED").reduce((s, p) => s + p.amount, 0);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard icon={FileText}     label="Total Proposals" value={proposals.length}    iconBg="bg-blue-50"    iconColor="text-blue-600" />
        <StatCard icon={Send}         label="Proposal Sent"   value={sent}                iconBg="bg-sky-50"     iconColor="text-sky-600" />
        <StatCard icon={CheckCircle}  label="Completed"       value={completed}           iconBg="bg-emerald-50" iconColor="text-emerald-600" />
        <StatCard icon={DollarSign}   label="Total Revenue"   value={formatCurrency(revenue)} iconBg="bg-amber-50" iconColor="text-amber-600" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <h2 className="text-[13px] font-semibold text-gray-700">All Proposals</h2>
            <span className="bg-gray-100 text-gray-500 text-[11px] px-2 py-0.5 rounded-full font-semibold">{filtered.length}</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search proposals..." className="pl-8 pr-3 py-2 text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 bg-white placeholder:text-gray-300 text-gray-700 w-52 transition-all" />
            </div>
            <ExportButtons data={exportData} filename="proposals" />
            <button onClick={openAdd} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-[13px] font-semibold rounded-lg hover:bg-blue-700 active:scale-[0.98] transition-all">
              <Plus className="w-4 h-4" />Add Proposal
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Client", "Project", "Platform", "Service", "Amount", "Costing", "Status", "Follow Up", "Added By", "Date", ""].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={11}>
                  <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                    <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-3">
                      <FileText className="w-5 h-5 text-gray-300" />
                    </div>
                    <p className="text-[13px] font-medium text-gray-500">No proposals yet</p>
                    <p className="text-[12px] mt-1">Add your first proposal to get started</p>
                  </div>
                </td></tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="group border-b border-gray-100 hover:bg-blue-50/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={p.client.name} />
                        <div>
                          <p className="text-[13px] font-semibold text-gray-700">{p.client.name}</p>
                          <p className="text-[11px] text-gray-400 font-mono">{p.client.clientId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-[13px] font-medium text-gray-700">{p.projectName}</td>
                    <td className="px-5 py-3.5 text-[13px] text-gray-500">{p.platform}</td>
                    <td className="px-5 py-3.5 text-[13px] text-gray-500">{SERVICE_TYPE_LABELS[p.serviceType]}</td>
                    <td className="px-5 py-3.5 text-[13px] font-semibold text-gray-700">{formatCurrency(p.amount)}</td>
                    <td className="px-5 py-3.5 text-[13px] text-gray-500">{formatCurrency(p.costing)}</td>
                    <td className="px-5 py-3.5"><StatusBadge status={p.currentStatus} label={PROPOSAL_STATUS_LABELS[p.currentStatus] ?? p.currentStatus} /></td>
                    <td className="px-5 py-3.5 text-[13px] text-center text-gray-500">{p.followUp > 0 ? `FU ${p.followUp}` : <span className="text-gray-300">—</span>}</td>
                    <td className="px-5 py-3.5 text-[12px] text-gray-500 whitespace-nowrap">{p.user?.name ?? <span className="text-gray-300">—</span>}</td>
                    <td className="px-5 py-3.5 text-[12px] text-gray-400 whitespace-nowrap">{formatDate(p.createdAt)}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openUpdate(p)} className="px-2.5 py-1 text-[11px] font-semibold bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors">Update</button>
                        <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={() => del(p.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={modal === "add" || modal === "edit"} onClose={() => setModal(null)} title={modal === "add" ? "Add Proposal" : "Edit Proposal"} size="xl">
        {error && <p className="mb-3 text-sm text-red-600 bg-red-50 p-3 rounded-lg font-medium">{error}</p>}
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Client ID" required>
            <div className="flex gap-2">
              <input value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })} className={inputClass()} placeholder="CLT-XXXX-XXXX" />
              <button onClick={() => lookupClient(form.clientId)} className="px-3 py-2 text-xs font-semibold bg-blue-600 text-white rounded-lg whitespace-nowrap hover:bg-blue-700">Lookup</button>
            </div>
          </FormField>
          {clientInfo && (
            <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-800 col-span-1">
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
          <button onClick={() => setModal(null)} className="px-4 py-2 text-sm font-medium border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600">Cancel</button>
          <button onClick={save} disabled={loading} className="px-5 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-all">
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </Modal>

      <Modal isOpen={modal === "update"} onClose={() => setModal(null)} title="Update Proposal Status">
        {updateError && <p className="mb-3 text-sm text-red-600 bg-red-50 p-3 rounded-lg font-medium">{updateError}</p>}
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
          <button onClick={() => setModal(null)} className="px-4 py-2 text-sm font-medium border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600">Cancel</button>
          <button onClick={saveUpdate} disabled={loading} className="px-5 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-all">
            {loading ? "Saving..." : "Update"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
