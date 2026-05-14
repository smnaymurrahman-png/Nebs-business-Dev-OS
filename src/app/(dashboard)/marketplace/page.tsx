"use client";

import { useEffect, useState } from "react";
import { type ComponentType } from "react";
import { Modal } from "@/components/shared/Modal";
import { FormField, inputClass, selectClass } from "@/components/shared/FormField";
import { ExportButtons } from "@/components/shared/ExportButtons";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatCurrency, formatDate, PROFILE_TYPE_LABELS } from "@/lib/utils";
import { Plus, Pencil, Trash2, Search, Store, BadgeDollarSign, PiggyBank, DollarSign } from "lucide-react";

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

  const paid = profiles.filter((p) => p.isPaid).length;
  const totalInvestment = profiles.reduce((s, p) => s + p.totalInvestment, 0);
  const totalValue = profiles.reduce((s, p) => s + p.amount, 0);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={Store} label="Total Profiles" value={profiles.length} iconBg="bg-gradient-to-br from-violet-50 to-violet-100" iconColor="text-violet-600" />
        <StatCard icon={BadgeDollarSign} label="Paid Profiles" value={paid} iconBg="bg-gradient-to-br from-emerald-50 to-emerald-100" iconColor="text-emerald-600" />
        <StatCard icon={PiggyBank} label="Total Investment" value={formatCurrency(totalInvestment)} iconBg="bg-gradient-to-br from-orange-50 to-orange-100" iconColor="text-orange-600" />
        <StatCard icon={DollarSign} label="Total Value" value={formatCurrency(totalValue)} iconBg="bg-gradient-to-br from-amber-50 to-amber-100" iconColor="text-amber-600" />
      </div>

      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-[#F1F5F9] flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <h2 className="text-[13px] font-semibold text-slate-700">Marketplace Profiles</h2>
            <span className="bg-slate-100 text-slate-600 text-[11px] px-2 py-0.5 rounded-full font-semibold">{filtered.length}</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search profiles..." className="pl-8 pr-3 py-2 text-[13px] font-medium border border-[#E2E8F0] rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400/40 focus:border-violet-300 bg-white placeholder:text-slate-300 text-slate-700 shadow-sm w-52 transition-all" />
            </div>
            <ExportButtons data={exportData} filename="marketplace-profiles" />
            <button onClick={openAdd} className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-[13px] font-semibold rounded-xl hover:from-violet-700 hover:to-indigo-700 shadow-md shadow-violet-200 hover:shadow-lg hover:shadow-violet-300/50 active:scale-[0.98] transition-all">
              <Plus className="w-4 h-4" />Add Profile
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#F8FAFC] border-b border-[#F1F5F9]">
              <tr>
                {["Platform", "Profile", "Email", "Phone", "Profile Type", "Paid?", "Total Inv.", "Amount", "Assigned", "Date", ""].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={11}>
                  <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                      <Store className="w-6 h-6 text-slate-300" />
                    </div>
                    <p className="text-sm font-medium text-slate-500">No profiles yet</p>
                    <p className="text-xs mt-1">Add your first marketplace profile to get started</p>
                  </div>
                </td></tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="group border-b border-[#F1F5F9] hover:bg-violet-50/40 transition-colors">
                    <td className="px-5 py-3.5 text-[13px] font-semibold text-slate-700">{p.platformName}</td>
                    <td className="px-5 py-3.5 text-[13px] text-slate-600">{p.profileName}</td>
                    <td className="px-5 py-3.5 text-[13px] text-slate-500">{p.emailAddress}</td>
                    <td className="px-5 py-3.5 text-[13px] text-slate-500">{p.phoneNumber}</td>
                    <td className="px-5 py-3.5"><StatusBadge status={p.profileType} label={PROFILE_TYPE_LABELS[p.profileType] ?? p.profileType} /></td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-[11px] font-semibold ${p.isPaid ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100" : "bg-slate-100 text-slate-600"}`}>
                        {p.isPaid ? "Paid" : "Free"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-[13px] font-semibold text-orange-600">{formatCurrency(p.totalInvestment)}</td>
                    <td className="px-5 py-3.5 text-[13px] font-semibold text-slate-700">{formatCurrency(p.amount)}</td>
                    <td className="px-5 py-3.5 text-[13px] text-slate-500">{p.assignedPerson || <span className="text-slate-300">—</span>}</td>
                    <td className="px-5 py-3.5 text-[12px] text-slate-400 whitespace-nowrap">{formatDate(p.createdAt)}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={() => del(p.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
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
          <button onClick={() => setModal(null)} className="px-4 py-2 text-sm font-medium border border-[#E2E8F0] rounded-xl hover:bg-slate-50 text-slate-600">Cancel</button>
          <button onClick={save} disabled={loading} className="px-5 py-2 text-sm font-semibold bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl hover:from-violet-700 hover:to-indigo-700 disabled:opacity-60 transition-all shadow-sm shadow-violet-200">
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
