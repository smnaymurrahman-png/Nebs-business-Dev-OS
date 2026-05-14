"use client";

import { useEffect, useState } from "react";
import { type ComponentType } from "react";
import { Modal } from "@/components/shared/Modal";
import { FormField, inputClass, selectClass } from "@/components/shared/FormField";
import { ExportButtons } from "@/components/shared/ExportButtons";
import { formatCurrency, formatDate, AD_PLATFORM_LABELS } from "@/lib/utils";
import { Plus, Pencil, Trash2, Search, BarChart2, DollarSign, Users, Calendar } from "lucide-react";

interface Report {
  id: string;
  platform: string;
  landingPageLink: string;
  adsStartingDate: string;
  budgetType: string;
  budget: number;
  totalSpend: number;
  totalClicks: number;
  totalLeads: number;
  totalMeetings: number;
  createdAt: string;
  user?: { name: string };
}

const AD_PLATFORMS = ["GOOGLE_ADS", "YOUTUBE_ADS", "BING_ADS", "OTHER_ADS"];
const PLATFORM_BADGE: Record<string, string> = {
  GOOGLE_ADS: "bg-blue-50 text-blue-700 ring-1 ring-blue-100",
  YOUTUBE_ADS: "bg-red-50 text-red-700 ring-1 ring-red-100",
  BING_ADS: "bg-teal-50 text-teal-700 ring-1 ring-teal-100",
  OTHER_ADS: "bg-slate-100 text-slate-600",
};
const emptyForm = { platform: "GOOGLE_ADS", landingPageLink: "", adsStartingDate: "", budgetType: "DAILY", budget: "", totalSpend: "", totalClicks: "", totalLeads: "", totalMeetings: "" };

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

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [selected, setSelected] = useState<Report | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = () => fetch("/api/reports").then((r) => r.json()).then(setReports);
  useEffect(() => { load(); }, []);

  const filtered = reports.filter((r) =>
    [r.platform, r.landingPageLink].some((v) => v.toLowerCase().includes(search.toLowerCase()))
  );

  const openAdd = () => { setForm(emptyForm); setError(""); setModal("add"); };
  const openEdit = (r: Report) => {
    setSelected(r);
    setForm({ platform: r.platform, landingPageLink: r.landingPageLink, adsStartingDate: r.adsStartingDate.slice(0, 10), budgetType: r.budgetType, budget: String(r.budget), totalSpend: String(r.totalSpend), totalClicks: String(r.totalClicks), totalLeads: String(r.totalLeads), totalMeetings: String(r.totalMeetings) });
    setError(""); setModal("edit");
  };

  const save = async () => {
    setLoading(true); setError("");
    try {
      const res = modal === "add"
        ? await fetch("/api/reports", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
        : await fetch(`/api/reports/${selected!.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) { const e = await res.json(); setError(e.error ?? "Error"); return; }
      await load(); setModal(null);
    } finally { setLoading(false); }
  };

  const del = async (id: string) => {
    if (!confirm("Delete this report?")) return;
    await fetch(`/api/reports/${id}`, { method: "DELETE" });
    load();
  };

  const exportData = filtered.map(({ platform, landingPageLink, adsStartingDate, budgetType, budget, totalSpend, totalClicks, totalLeads, totalMeetings, createdAt }) => ({
    "Platform": AD_PLATFORM_LABELS[platform], "Landing Page": landingPageLink, "Start Date": formatDate(adsStartingDate),
    "Budget Type": budgetType, "Budget": budget, "Total Spend": totalSpend, "Total Clicks": totalClicks,
    "Total Leads": totalLeads, "Total Meetings": totalMeetings, "Created": formatDate(createdAt),
  }));

  const totalSpend = reports.reduce((s, r) => s + r.totalSpend, 0);
  const totalLeads = reports.reduce((s, r) => s + r.totalLeads, 0);
  const totalMeetings = reports.reduce((s, r) => s + r.totalMeetings, 0);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard icon={BarChart2} label="Total Reports" value={reports.length} iconBg="bg-gradient-to-br from-violet-50 to-violet-100" iconColor="text-violet-600" />
        <StatCard icon={DollarSign} label="Total Spend" value={formatCurrency(totalSpend)} iconBg="bg-gradient-to-br from-orange-50 to-orange-100" iconColor="text-orange-600" />
        <StatCard icon={Users} label="Total Leads" value={totalLeads.toLocaleString()} iconBg="bg-gradient-to-br from-emerald-50 to-emerald-100" iconColor="text-emerald-600" />
        <StatCard icon={Calendar} label="Meetings Set" value={totalMeetings} iconBg="bg-gradient-to-br from-blue-50 to-blue-100" iconColor="text-blue-600" />
      </div>

      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-[#F1F5F9] flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <h2 className="text-[13px] font-semibold text-slate-700">Ad Reports</h2>
            <span className="bg-slate-100 text-slate-600 text-[11px] px-2 py-0.5 rounded-full font-semibold">{filtered.length}</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search reports..." className="pl-8 pr-3 py-2 text-[13px] font-medium border border-[#E2E8F0] rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400/40 focus:border-violet-300 bg-white placeholder:text-slate-300 text-slate-700 shadow-sm w-52 transition-all" />
            </div>
            <ExportButtons data={exportData} filename="reports" />
            <button onClick={openAdd} className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-[13px] font-semibold rounded-xl hover:from-violet-700 hover:to-indigo-700 shadow-md shadow-violet-200 hover:shadow-lg hover:shadow-violet-300/50 active:scale-[0.98] transition-all">
              <Plus className="w-4 h-4" />Add Report
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#F8FAFC] border-b border-[#F1F5F9]">
              <tr>
                {["Platform", "Landing Page", "Start Date", "Budget", "Spend", "Clicks", "Leads", "Meetings", "Date", ""].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={10}>
                  <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                      <BarChart2 className="w-6 h-6 text-slate-300" />
                    </div>
                    <p className="text-sm font-medium text-slate-500">No reports yet</p>
                    <p className="text-xs mt-1">Add your first ad report to get started</p>
                  </div>
                </td></tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id} className="group border-b border-[#F1F5F9] hover:bg-violet-50/40 transition-colors">
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-[11px] font-semibold ${PLATFORM_BADGE[r.platform] ?? "bg-slate-100 text-slate-600"}`}>
                        {AD_PLATFORM_LABELS[r.platform]}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 max-w-[180px] truncate">
                      <a href={r.landingPageLink} target="_blank" rel="noreferrer" className="text-[13px] text-violet-600 hover:underline">{r.landingPageLink}</a>
                    </td>
                    <td className="px-5 py-3.5 text-[12px] text-slate-500 whitespace-nowrap">{formatDate(r.adsStartingDate)}</td>
                    <td className="px-5 py-3.5 text-[13px] font-semibold text-slate-700">
                      {formatCurrency(r.budget)}<span className="text-[11px] text-slate-400 font-normal ml-1">/{r.budgetType === "DAILY" ? "day" : "life"}</span>
                    </td>
                    <td className="px-5 py-3.5 text-[13px] font-semibold text-orange-600">{formatCurrency(r.totalSpend)}</td>
                    <td className="px-5 py-3.5 text-[13px] text-slate-600 text-center">{r.totalClicks.toLocaleString()}</td>
                    <td className="px-5 py-3.5 text-[13px] text-slate-600 text-center">{r.totalLeads}</td>
                    <td className="px-5 py-3.5 text-[13px] text-slate-600 text-center">{r.totalMeetings}</td>
                    <td className="px-5 py-3.5 text-[12px] text-slate-400 whitespace-nowrap">{formatDate(r.createdAt)}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdit(r)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={() => del(r.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={!!modal} onClose={() => setModal(null)} title={modal === "add" ? "Add Report" : "Edit Report"} size="lg">
        {error && <p className="mb-3 text-sm text-red-600 bg-red-50 p-3 rounded-xl font-medium">{error}</p>}
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Platform" required>
            <select value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })} className={selectClass()}>
              {AD_PLATFORMS.map((p) => (<option key={p} value={p}>{AD_PLATFORM_LABELS[p]}</option>))}
            </select>
          </FormField>
          <FormField label="Budget Type" required>
            <select value={form.budgetType} onChange={(e) => setForm({ ...form, budgetType: e.target.value })} className={selectClass()}>
              <option value="DAILY">Daily Budget</option><option value="LIFETIME">Lifetime Budget</option>
            </select>
          </FormField>
          <FormField label="Landing Page Link" required className="col-span-2">
            <input value={form.landingPageLink} onChange={(e) => setForm({ ...form, landingPageLink: e.target.value })} className={inputClass()} placeholder="https://..." />
          </FormField>
          <FormField label="Ads Starting Date" required>
            <input type="date" value={form.adsStartingDate} onChange={(e) => setForm({ ...form, adsStartingDate: e.target.value })} className={inputClass()} />
          </FormField>
          <FormField label="Budget (USD)" required>
            <input type="number" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} className={inputClass()} placeholder="0.00" />
          </FormField>
          <FormField label="Total Spend (USD)">
            <input type="number" value={form.totalSpend} onChange={(e) => setForm({ ...form, totalSpend: e.target.value })} className={inputClass()} placeholder="0.00" />
          </FormField>
          <FormField label="Total Clicks">
            <input type="number" value={form.totalClicks} onChange={(e) => setForm({ ...form, totalClicks: e.target.value })} className={inputClass()} placeholder="0" />
          </FormField>
          <FormField label="Total Leads">
            <input type="number" value={form.totalLeads} onChange={(e) => setForm({ ...form, totalLeads: e.target.value })} className={inputClass()} placeholder="0" />
          </FormField>
          <FormField label="Total Meeting Set">
            <input type="number" value={form.totalMeetings} onChange={(e) => setForm({ ...form, totalMeetings: e.target.value })} className={inputClass()} placeholder="0" />
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
