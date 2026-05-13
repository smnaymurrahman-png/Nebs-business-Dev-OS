"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/shared/Modal";
import { FormField, inputClass, selectClass } from "@/components/shared/FormField";
import { ExportButtons } from "@/components/shared/ExportButtons";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatCurrency, formatDate, PROFILE_TYPE_LABELS } from "@/lib/utils";
import { Plus, Pencil, Trash2, Search } from "lucide-react";

interface MarketplaceProfile {
  id: string;
  platformName: string;
  profileName: string;
  emailAddress: string;
  password: string;
  phoneNumber: string;
  specialQuestion?: string;
  specialAnswer?: string;
  profileType: string;
  isPaid: boolean;
  totalInvestment: number;
  amount: number;
  assignedPerson?: string;
  assignedDevice?: string;
  assignedIp?: string;
  createdAt: string;
  user?: { name: string };
}

const PROFILE_TYPES = ["UI_UX", "WORDPRESS", "FULL_STACK", "DIGITAL_MARKETING", "WEBFLOW_SHOPIFY_FRAMER", "OTHER"];
const emptyForm = {
  platformName: "", profileName: "", emailAddress: "", password: "", phoneNumber: "",
  specialQuestion: "", specialAnswer: "", profileType: "UI_UX", isPaid: false,
  totalInvestment: "", amount: "", assignedPerson: "", assignedDevice: "", assignedIp: "",
};

export default function MarketplacePage() {
  const [profiles, setProfiles] = useState<MarketplaceProfile[]>([]);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [selected, setSelected] = useState<MarketplaceProfile | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = () => fetch("/api/marketplace").then((r) => r.json()).then(setProfiles);
  useEffect(() => { load(); }, []);

  const filtered = profiles.filter((p) =>
    [p.platformName, p.profileName, p.emailAddress].some((v) => v.toLowerCase().includes(search.toLowerCase()))
  );

  const openAdd = () => { setForm(emptyForm); setError(""); setModal("add"); };
  const openEdit = (p: MarketplaceProfile) => {
    setSelected(p);
    setForm({ platformName: p.platformName, profileName: p.profileName, emailAddress: p.emailAddress, password: p.password, phoneNumber: p.phoneNumber, specialQuestion: p.specialQuestion ?? "", specialAnswer: p.specialAnswer ?? "", profileType: p.profileType, isPaid: p.isPaid, totalInvestment: String(p.totalInvestment), amount: String(p.amount), assignedPerson: p.assignedPerson ?? "", assignedDevice: p.assignedDevice ?? "", assignedIp: p.assignedIp ?? "" });
    setError(""); setModal("edit");
  };

  const save = async () => {
    setLoading(true); setError("");
    try {
      const res = modal === "add"
        ? await fetch("/api/marketplace", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
        : await fetch(`/api/marketplace/${selected!.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) { const e = await res.json(); setError(e.error ?? "Error"); return; }
      await load(); setModal(null);
    } finally { setLoading(false); }
  };

  const del = async (id: string) => {
    if (!confirm("Delete this profile?")) return;
    await fetch(`/api/marketplace/${id}`, { method: "DELETE" });
    load();
  };

  const exportData = filtered.map(({ platformName, profileName, emailAddress, phoneNumber, profileType, isPaid, totalInvestment, amount, assignedPerson, assignedDevice, assignedIp, createdAt }) => ({
    "Platform": platformName, "Profile Name": profileName, "Email": emailAddress, "Phone": phoneNumber,
    "Profile Type": PROFILE_TYPE_LABELS[profileType], "Is Paid": isPaid ? "Yes" : "No",
    "Total Investment": totalInvestment, "Amount": amount, "Assigned Person": assignedPerson,
    "Device": assignedDevice, "IP": assignedIp, "Date": formatDate(createdAt),
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search profiles..." className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400 bg-gray-50/50" />
        </div>
        <div className="flex items-center gap-2">
          <ExportButtons data={exportData} filename="marketplace-profiles" />
          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-semibold rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all shadow-sm">
            <Plus className="w-4 h-4" />Add Profile
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50/80 border-b border-gray-100">
              <tr>
                {["Platform", "Profile", "Email", "Phone", "Profile Type", "Paid?", "Total Inv.", "Amount", "Assigned", "Date", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-medium text-gray-600 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={11} className="px-4 py-10 text-center text-gray-400">No profiles found</td></tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{p.platformName}</td>
                    <td className="px-4 py-3">{p.profileName}</td>
                    <td className="px-4 py-3 text-gray-600">{p.emailAddress}</td>
                    <td className="px-4 py-3 text-gray-600">{p.phoneNumber}</td>
                    <td className="px-4 py-3"><StatusBadge status={p.profileType} label={PROFILE_TYPE_LABELS[p.profileType] ?? p.profileType} /></td>
                    <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.isPaid ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"}`}>{p.isPaid ? "Paid" : "Free"}</span></td>
                    <td className="px-4 py-3 font-semibold">{formatCurrency(p.totalInvestment)}</td>
                    <td className="px-4 py-3 font-semibold">{formatCurrency(p.amount)}</td>
                    <td className="px-4 py-3 text-gray-500">{p.assignedPerson}</td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(p.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
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

      <Modal isOpen={!!modal} onClose={() => setModal(null)} title={modal === "add" ? "Add Marketplace Profile" : "Edit Profile"} size="xl">
        {error && <p className="mb-3 text-sm text-red-600 bg-red-50 p-3 rounded-xl font-medium">{error}</p>}
        <div className="grid grid-cols-2 gap-4">
          {[["Platform Name", "platformName", "Upwork"], ["Profile Name", "profileName", "Display name"], ["Email Address", "emailAddress", "email@example.com"], ["Password", "password", "••••••••"], ["Phone Number", "phoneNumber", "+1 234 567 890"], ["Special Question", "specialQuestion", "Security question"], ["Special Answer", "specialAnswer", "Answer"], ["Assigned Person", "assignedPerson", "Name"], ["Assigned Device", "assignedDevice", "Device"], ["Assigned IP", "assignedIp", "IP"]].map(([label, key, ph]) => (
            <FormField key={key} label={label}>
              <input value={(form as Record<string, string | boolean>)[key] as string} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className={inputClass()} placeholder={ph} type={key === "password" ? "password" : "text"} />
            </FormField>
          ))}
          <FormField label="Profile Type" required>
            <select value={form.profileType} onChange={(e) => setForm({ ...form, profileType: e.target.value })} className={selectClass()}>
              {PROFILE_TYPES.map((t) => (<option key={t} value={t}>{PROFILE_TYPE_LABELS[t]}</option>))}
            </select>
          </FormField>
          <FormField label="Account Type" required>
            <select value={String(form.isPaid)} onChange={(e) => setForm({ ...form, isPaid: e.target.value === "true" })} className={selectClass()}>
              <option value="false">Free</option><option value="true">Paid</option>
            </select>
          </FormField>
          <FormField label="Total Investment (USD)">
            <input type="number" value={form.totalInvestment} onChange={(e) => setForm({ ...form, totalInvestment: e.target.value })} className={inputClass()} placeholder="0.00" />
          </FormField>
          <FormField label="Amount (USD)" required>
            <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className={inputClass()} placeholder="0.00" />
          </FormField>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={() => setModal(null)} className="px-4 py-2 text-sm font-medium border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600">Cancel</button>
          <button onClick={save} disabled={loading} className="px-4 py-2 text-sm font-semibold bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl hover:from-violet-700 hover:to-indigo-700 disabled:opacity-60 transition-all shadow-sm">
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
