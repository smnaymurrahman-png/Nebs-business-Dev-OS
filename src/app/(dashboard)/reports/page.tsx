"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/shared/Modal";
import { FormField, inputClass, selectClass } from "@/components/shared/FormField";
import { ExportButtons } from "@/components/shared/ExportButtons";
import { formatCurrency, formatDate, AD_PLATFORM_LABELS } from "@/lib/utils";
import { Plus, Pencil, Trash2, Search } from "lucide-react";

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
const emptyForm = { platform: "GOOGLE_ADS", landingPageLink: "", adsStartingDate: "", budgetType: "DAILY", budget: "", totalSpend: "", totalClicks: "", totalLeads: "", totalMeetings: "" };

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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search reports..." className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="flex items-center gap-2">
          <ExportButtons data={exportData} filename="reports" />
          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
            <Plus className="w-4 h-4" />Add Report
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {["Platform", "Landing Page", "Start Date", "Budget", "Spend", "Clicks", "Leads", "Meetings", "Date", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-medium text-gray-600 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={10} className="px-4 py-10 text-center text-gray-400">No reports found</td></tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{AD_PLATFORM_LABELS[r.platform]}</td>
                    <td className="px-4 py-3 text-blue-600 max-w-[180px] truncate"><a href={r.landingPageLink} target="_blank" rel="noreferrer" className="hover:underline">{r.landingPageLink}</a></td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatDate(r.adsStartingDate)}</td>
                    <td className="px-4 py-3 font-medium">{formatCurrency(r.budget)}<span className="text-xs text-gray-400 ml-1">/{r.budgetType === "DAILY" ? "day" : "life"}</span></td>
                    <td className="px-4 py-3 text-orange-600 font-medium">{formatCurrency(r.totalSpend)}</td>
                    <td className="px-4 py-3 text-center">{r.totalClicks.toLocaleString()}</td>
                    <td className="px-4 py-3 text-center">{r.totalLeads}</td>
                    <td className="px-4 py-3 text-center">{r.totalMeetings}</td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(r.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(r)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={() => del(r.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
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
        {error && <p className="mb-3 text-sm text-red-500 bg-red-50 p-2 rounded-lg">{error}</p>}
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
          <button onClick={() => setModal(null)} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={save} disabled={loading} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
