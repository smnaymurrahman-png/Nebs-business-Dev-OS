"use client";

import { useEffect, useState, type ComponentType } from "react";
import { Modal } from "@/components/shared/Modal";
import { FormField, inputClass, selectClass } from "@/components/shared/FormField";
import { ExportButtons } from "@/components/shared/ExportButtons";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatCurrency, formatDate, PROFILE_TYPE_LABELS } from "@/lib/utils";
import {
  Plus, Pencil, Trash2, Search, LayoutGrid, BadgeDollarSign, Layers, TrendingUp,
  Eye, Copy, Check, X, Monitor, Wifi, User,
} from "lucide-react";

interface Account {
  id: string; platformName: string; profileName: string; emailAddress: string;
  password: string; phoneNumber: string; specialQuestion?: string; specialAnswer?: string;
  profileType: string; accountType: string; subscriptionType: string; amount: number;
  assignedPerson?: string; assignedDevice?: string; assignedIp?: string;
  additionalDevice?: string; createdAt: string; user?: { name: string };
}

const PROFILE_TYPES = ["UI_UX", "WORDPRESS", "FULL_STACK", "DIGITAL_MARKETING", "WEBFLOW_SHOPIFY_FRAMER", "OTHER"];
const emptyForm = {
  platformName: "", profileName: "", emailAddress: "", password: "", phoneNumber: "",
  specialQuestion: "", specialAnswer: "", profileType: "UI_UX", accountType: "FREE",
  subscriptionType: "MONTHLY", amount: "", assignedPerson: "", assignedDevice: "",
  assignedIp: "", additionalDevice: "",
};

function StatCard({ icon: Icon, label, value, iconBg, iconColor }: { icon: ComponentType<{ className?: string }>; label: string; value: string | number; iconBg: string; iconColor: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className={`w-9 h-9 rounded-lg ${iconBg} flex items-center justify-center`}><Icon className={`w-4 h-4 ${iconColor}`} /></div>
      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mt-3">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
    </div>
  );
}

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
      <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
        <span className="flex-1 font-mono text-[13px] text-gray-800 break-all">{value || "—"}</span>
        {value && (
          <button onClick={copy} className={`shrink-0 flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold transition-all ${copied ? "bg-emerald-100 text-emerald-700" : "bg-white border border-gray-200 text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}>
            {copied ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
          </button>
        )}
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value?: string | number | null }) {
  if (!value && value !== 0) return null;
  return (
    <div>
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-[13px] text-gray-700">{String(value)}</p>
    </div>
  );
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<"add" | "edit" | "view" | null>(null);
  const [selected, setSelected] = useState<Account | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = () => fetch("/api/accounts").then(r => r.json()).then(setAccounts);
  useEffect(() => { load(); }, []);

  const filtered = accounts.filter(a =>
    [a.platformName, a.profileName, a.emailAddress].some(v => v.toLowerCase().includes(search.toLowerCase()))
  );

  const openView = (a: Account) => { setSelected(a); setModal("view"); };
  const openAdd = () => { setForm(emptyForm); setError(""); setModal("add"); };
  const openEdit = (a: Account) => {
    setSelected(a);
    setForm({ platformName: a.platformName, profileName: a.profileName, emailAddress: a.emailAddress, password: a.password, phoneNumber: a.phoneNumber, specialQuestion: a.specialQuestion ?? "", specialAnswer: a.specialAnswer ?? "", profileType: a.profileType, accountType: a.accountType, subscriptionType: a.subscriptionType, amount: String(a.amount), assignedPerson: a.assignedPerson ?? "", assignedDevice: a.assignedDevice ?? "", assignedIp: a.assignedIp ?? "", additionalDevice: a.additionalDevice ?? "" });
    setError(""); setModal("edit");
  };

  const save = async () => {
    setLoading(true); setError("");
    try {
      const res = modal === "add"
        ? await fetch("/api/accounts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
        : await fetch(`/api/accounts/${selected!.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) { const e = await res.json(); setError(e.error ?? "Error"); return; }
      await load(); setModal(null);
    } finally { setLoading(false); }
  };

  const del = async (id: string) => {
    if (!confirm("Delete this account?")) return;
    await fetch(`/api/accounts/${id}`, { method: "DELETE" });
    load();
  };

  const exportData = filtered.map(({ platformName, profileName, emailAddress, phoneNumber, profileType, accountType, subscriptionType, amount, assignedPerson, assignedDevice, assignedIp, createdAt }) => ({
    "Platform": platformName, "Profile Name": profileName, "Email": emailAddress, "Phone": phoneNumber,
    "Profile Type": PROFILE_TYPE_LABELS[profileType], "Account Type": accountType, "Subscription": subscriptionType,
    "Amount": amount, "Assigned Person": assignedPerson, "Device": assignedDevice, "IP": assignedIp, "Date": formatDate(createdAt),
  }));

  const paid = accounts.filter(a => a.accountType === "PAID").length;
  const free = accounts.filter(a => a.accountType === "FREE").length;
  const totalValue = accounts.reduce((s, a) => s + a.amount, 0);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard icon={LayoutGrid}      label="Total Accounts" value={accounts.length}            iconBg="bg-blue-50"    iconColor="text-blue-600" />
        <StatCard icon={BadgeDollarSign} label="Paid Accounts"  value={paid}                       iconBg="bg-emerald-50" iconColor="text-emerald-600" />
        <StatCard icon={Layers}          label="Free Accounts"  value={free}                       iconBg="bg-gray-100"   iconColor="text-gray-500" />
        <StatCard icon={TrendingUp}      label="Total Value"    value={formatCurrency(totalValue)} iconBg="bg-amber-50"   iconColor="text-amber-600" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <h2 className="text-[13px] font-semibold text-gray-700">All Accounts</h2>
            <span className="bg-gray-100 text-gray-500 text-[11px] px-2 py-0.5 rounded-full font-semibold">{filtered.length}</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search accounts…" className="pl-8 pr-3 py-2 text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 bg-white placeholder:text-gray-300 text-gray-700 w-52 transition-all" />
            </div>
            <ExportButtons data={exportData} filename="accounts" />
            <button onClick={openAdd} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-[13px] font-semibold rounded-lg hover:bg-blue-700 active:scale-[0.98] transition-all">
              <Plus className="w-4 h-4" /> Add Account
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Platform", "Profile", "Email", "Phone", "Profile Type", "Type", "Sub", "Amount", "Assigned To", "Date", ""].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={11}>
                  <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                    <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-3"><LayoutGrid className="w-5 h-5 text-gray-300" /></div>
                    <p className="text-[13px] font-medium text-gray-500">No accounts yet</p>
                    <p className="text-[12px] mt-1">Add your first account to get started</p>
                  </div>
                </td></tr>
              ) : filtered.map(a => (
                <tr key={a.id} className="border-b border-gray-100 hover:bg-blue-50/30 transition-colors">
                  <td className="px-5 py-3.5 text-[13px] font-semibold text-gray-700">{a.platformName}</td>
                  <td className="px-5 py-3.5 text-[13px] text-gray-600">{a.profileName}</td>
                  <td className="px-5 py-3.5 text-[13px] text-gray-500 max-w-[160px] truncate">{a.emailAddress}</td>
                  <td className="px-5 py-3.5 text-[13px] text-gray-500">{a.phoneNumber}</td>
                  <td className="px-5 py-3.5"><StatusBadge status={a.profileType} label={PROFILE_TYPE_LABELS[a.profileType] ?? a.profileType} /></td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${a.accountType === "PAID" ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100" : "bg-gray-100 text-gray-600"}`}>
                      {a.accountType}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-[12px] text-gray-500">{a.subscriptionType}</td>
                  <td className="px-5 py-3.5 text-[13px] font-semibold text-gray-700">{formatCurrency(a.amount)}</td>
                  <td className="px-5 py-3.5 text-[13px] text-gray-500">{a.assignedPerson || <span className="text-gray-300">—</span>}</td>
                  <td className="px-5 py-3.5 text-[12px] text-gray-400 whitespace-nowrap">{formatDate(a.createdAt)}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openView(a)} className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors" title="View details">
                        <Eye className="w-3.5 h-3.5" /> View
                      </button>
                      <button onClick={() => openEdit(a)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors" title="Edit"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => del(a.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── View modal ───────────────────────────────────────── */}
      {selected && modal === "view" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{selected.platformName}</p>
                <h2 className="text-base font-bold text-gray-900 mt-0.5">{selected.profileName}</h2>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => openEdit(selected)} className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </button>
                <button onClick={() => setModal(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Credentials — copyable */}
              <div className="space-y-3">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Credentials</p>
                <CopyField label="Email Address" value={selected.emailAddress} />
                <CopyField label="Password" value={selected.password} />
              </div>

              <div className="h-px bg-gray-100" />

              {/* Info grid */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                <DetailRow label="Phone" value={selected.phoneNumber} />
                <DetailRow label="Profile Type" value={PROFILE_TYPE_LABELS[selected.profileType] ?? selected.profileType} />
                <DetailRow label="Account Type" value={selected.accountType} />
                <DetailRow label="Subscription" value={selected.subscriptionType} />
                <DetailRow label="Amount" value={formatCurrency(selected.amount)} />
                <DetailRow label="Date Added" value={formatDate(selected.createdAt)} />
              </div>

              {(selected.specialQuestion || selected.specialAnswer) && (
                <>
                  <div className="h-px bg-gray-100" />
                  <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                    <DetailRow label="Special Question" value={selected.specialQuestion} />
                    <DetailRow label="Special Answer" value={selected.specialAnswer} />
                  </div>
                </>
              )}

              {(selected.assignedPerson || selected.assignedDevice || selected.assignedIp || selected.additionalDevice) && (
                <>
                  <div className="h-px bg-gray-100" />
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Assignment</p>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                    {selected.assignedPerson && (
                      <div className="flex items-center gap-2"><User className="w-3.5 h-3.5 text-gray-400" /><div><p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Person</p><p className="text-[13px] text-gray-700">{selected.assignedPerson}</p></div></div>
                    )}
                    {selected.assignedDevice && (
                      <div className="flex items-center gap-2"><Monitor className="w-3.5 h-3.5 text-gray-400" /><div><p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Device</p><p className="text-[13px] text-gray-700">{selected.assignedDevice}</p></div></div>
                    )}
                    {selected.additionalDevice && (
                      <div className="flex items-center gap-2"><Monitor className="w-3.5 h-3.5 text-gray-400" /><div><p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Additional Device</p><p className="text-[13px] text-gray-700">{selected.additionalDevice}</p></div></div>
                    )}
                    {selected.assignedIp && (
                      <div className="flex items-center gap-2"><Wifi className="w-3.5 h-3.5 text-gray-400" /><div><p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">IP Address</p><p className="text-[13px] text-gray-700 font-mono">{selected.assignedIp}</p></div></div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-gray-100 flex justify-end">
              <button onClick={() => setModal(null)} className="px-4 py-2 text-sm font-medium border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add / Edit modal ─────────────────────────────────── */}
      <Modal isOpen={modal === "add" || modal === "edit"} onClose={() => setModal(null)} title={modal === "add" ? "Add Account" : "Edit Account"} size="xl">
        {error && <p className="mb-3 text-sm text-red-600 bg-red-50 p-3 rounded-lg font-medium">{error}</p>}
        <div className="grid grid-cols-2 gap-4">
          {([["Platform Name", "platformName", "Upwork, Fiverr…"], ["Profile Name", "profileName", "Profile display name"], ["Email Address", "emailAddress", "account@email.com"], ["Password", "password", "••••••••"], ["Phone Number", "phoneNumber", "+1 234 567 890"], ["Special Question", "specialQuestion", "Security question"], ["Special Answer", "specialAnswer", "Answer"], ["Assigned Person", "assignedPerson", "Name"], ["Assigned Device", "assignedDevice", "Device name"], ["Assigned IP", "assignedIp", "IP address"], ["Additional Device", "additionalDevice", "Additional device"]] as [string, string, string][]).map(([label, key, ph]) => (
            <FormField key={key} label={label}>
              <input value={(form as Record<string, string>)[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} className={inputClass()} placeholder={ph} />
            </FormField>
          ))}
          <FormField label="Profile Type" required>
            <select value={form.profileType} onChange={e => setForm({ ...form, profileType: e.target.value })} className={selectClass()}>
              {PROFILE_TYPES.map(t => <option key={t} value={t}>{PROFILE_TYPE_LABELS[t]}</option>)}
            </select>
          </FormField>
          <FormField label="Account Type" required>
            <select value={form.accountType} onChange={e => setForm({ ...form, accountType: e.target.value })} className={selectClass()}>
              <option value="FREE">Free</option><option value="PAID">Paid</option>
            </select>
          </FormField>
          <FormField label="Subscription Type" required>
            <select value={form.subscriptionType} onChange={e => setForm({ ...form, subscriptionType: e.target.value })} className={selectClass()}>
              <option value="MONTHLY">Monthly</option><option value="YEARLY">Yearly</option>
            </select>
          </FormField>
          <FormField label="Amount (USD)" required>
            <input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className={inputClass()} placeholder="0.00" />
          </FormField>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={() => setModal(null)} className="px-4 py-2 text-sm font-medium border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600">Cancel</button>
          <button onClick={save} disabled={loading} className="px-5 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-all">
            {loading ? "Saving…" : "Save"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
