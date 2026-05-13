"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/shared/Modal";
import { FormField, inputClass, selectClass } from "@/components/shared/FormField";
import { ExportButtons } from "@/components/shared/ExportButtons";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatCurrency, formatDate, PROFILE_TYPE_LABELS } from "@/lib/utils";
import { Plus, Pencil, Trash2, Search, Eye, EyeOff } from "lucide-react";

interface Account {
  id: string;
  platformName: string;
  profileName: string;
  emailAddress: string;
  password: string;
  phoneNumber: string;
  specialQuestion?: string;
  specialAnswer?: string;
  profileType: string;
  accountType: string;
  subscriptionType: string;
  amount: number;
  assignedPerson?: string;
  assignedDevice?: string;
  assignedIp?: string;
  additionalDevice?: string;
  createdAt: string;
  user?: { name: string };
}

const PROFILE_TYPES = ["UI_UX", "WORDPRESS", "FULL_STACK", "DIGITAL_MARKETING", "WEBFLOW_SHOPIFY_FRAMER", "OTHER"];
const emptyForm = {
  platformName: "", profileName: "", emailAddress: "", password: "", phoneNumber: "",
  specialQuestion: "", specialAnswer: "", profileType: "UI_UX", accountType: "FREE",
  subscriptionType: "MONTHLY", amount: "", assignedPerson: "", assignedDevice: "",
  assignedIp: "", additionalDevice: "",
};

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [selected, setSelected] = useState<Account | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPw, setShowPw] = useState<Record<string, boolean>>({});

  const load = () => fetch("/api/accounts").then((r) => r.json()).then(setAccounts);
  useEffect(() => { load(); }, []);

  const filtered = accounts.filter((a) =>
    [a.platformName, a.profileName, a.emailAddress].some((v) => v.toLowerCase().includes(search.toLowerCase()))
  );

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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search accounts..." className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="flex items-center gap-2">
          <ExportButtons data={exportData} filename="accounts" />
          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
            <Plus className="w-4 h-4" />Add Account
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {["Platform", "Profile", "Email", "Phone", "Password", "Profile Type", "Type", "Sub", "Amount", "Assigned To", "Date", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-medium text-gray-600 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={12} className="px-4 py-10 text-center text-gray-400">No accounts found</td></tr>
              ) : (
                filtered.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{a.platformName}</td>
                    <td className="px-4 py-3">{a.profileName}</td>
                    <td className="px-4 py-3 text-gray-600">{a.emailAddress}</td>
                    <td className="px-4 py-3 text-gray-600">{a.phoneNumber}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <span className="font-mono text-xs">{showPw[a.id] ? a.password : "••••••••"}</span>
                        <button onClick={() => setShowPw((p) => ({ ...p, [a.id]: !p[a.id] }))} className="p-1 text-gray-400 hover:text-gray-600">
                          {showPw[a.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={a.profileType} label={PROFILE_TYPE_LABELS[a.profileType] ?? a.profileType} /></td>
                    <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${a.accountType === "PAID" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"}`}>{a.accountType}</span></td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{a.subscriptionType}</td>
                    <td className="px-4 py-3 font-semibold">{formatCurrency(a.amount)}</td>
                    <td className="px-4 py-3 text-gray-500">{a.assignedPerson}</td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(a.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(a)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={() => del(a.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={!!modal} onClose={() => setModal(null)} title={modal === "add" ? "Add Account" : "Edit Account"} size="xl">
        {error && <p className="mb-3 text-sm text-red-500 bg-red-50 p-2 rounded-lg">{error}</p>}
        <div className="grid grid-cols-2 gap-4">
          {[["Platform Name", "platformName", "Upwork, Fiverr..."], ["Profile Name", "profileName", "Profile display name"], ["Email Address", "emailAddress", "account@email.com"], ["Password", "password", "••••••••"], ["Phone Number", "phoneNumber", "+1 234 567 890"], ["Special Question", "specialQuestion", "Security question"], ["Special Answer", "specialAnswer", "Answer"], ["Assigned Person", "assignedPerson", "Name"], ["Assigned Device", "assignedDevice", "Device name"], ["Assigned IP", "assignedIp", "IP address"], ["Additional Device", "additionalDevice", "Additional device"]].map(([label, key, ph]) => (
            <FormField key={key} label={label}>
              <input value={(form as Record<string, string>)[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className={inputClass()} placeholder={ph} type={key === "password" ? "password" : "text"} />
            </FormField>
          ))}
          <FormField label="Profile Type" required>
            <select value={form.profileType} onChange={(e) => setForm({ ...form, profileType: e.target.value })} className={selectClass()}>
              {PROFILE_TYPES.map((t) => (<option key={t} value={t}>{PROFILE_TYPE_LABELS[t]}</option>))}
            </select>
          </FormField>
          <FormField label="Account Type" required>
            <select value={form.accountType} onChange={(e) => setForm({ ...form, accountType: e.target.value })} className={selectClass()}>
              <option value="FREE">Free</option><option value="PAID">Paid</option>
            </select>
          </FormField>
          <FormField label="Subscription Type" required>
            <select value={form.subscriptionType} onChange={(e) => setForm({ ...form, subscriptionType: e.target.value })} className={selectClass()}>
              <option value="MONTHLY">Monthly</option><option value="YEARLY">Yearly</option>
            </select>
          </FormField>
          <FormField label="Amount (USD)" required>
            <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className={inputClass()} placeholder="0.00" />
          </FormField>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={() => setModal(null)} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={save} disabled={loading} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
