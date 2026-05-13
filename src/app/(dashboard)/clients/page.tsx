"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/shared/Modal";
import { FormField, inputClass } from "@/components/shared/FormField";
import { ExportButtons } from "@/components/shared/ExportButtons";
import { formatDate } from "@/lib/utils";
import { Plus, Pencil, Trash2, Search } from "lucide-react";

interface Client {
  id: string;
  clientId: string;
  name: string;
  email: string;
  phone: string;
  country: string;
  businessName: string;
  platform: string;
  createdAt: string;
  user?: { name: string };
}

const empty = { name: "", email: "", phone: "", country: "", businessName: "", platform: "" };

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [selected, setSelected] = useState<Client | null>(null);
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = () =>
    fetch("/api/clients").then((r) => r.json()).then(setClients);

  useEffect(() => { load(); }, []);

  const filtered = clients.filter((c) =>
    [c.name, c.email, c.clientId, c.businessName, c.country].some((v) =>
      v.toLowerCase().includes(search.toLowerCase())
    )
  );

  const openAdd = () => { setForm(empty); setError(""); setModal("add"); };
  const openEdit = (c: Client) => {
    setSelected(c);
    setForm({ name: c.name, email: c.email, phone: c.phone, country: c.country, businessName: c.businessName, platform: c.platform });
    setError("");
    setModal("edit");
  };

  const save = async () => {
    setLoading(true);
    setError("");
    try {
      const res = modal === "add"
        ? await fetch("/api/clients", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
        : await fetch(`/api/clients/${selected!.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) { const e = await res.json(); setError(e.error ?? "Error"); return; }
      await load();
      setModal(null);
    } finally { setLoading(false); }
  };

  const del = async (id: string) => {
    if (!confirm("Delete this client?")) return;
    await fetch(`/api/clients/${id}`, { method: "DELETE" });
    load();
  };

  const exportData = filtered.map(({ clientId, name, email, phone, country, businessName, platform, createdAt }) =>
    ({ "Client ID": clientId, Name: name, Email: email, Phone: phone, Country: country, "Business Name": businessName, Platform: platform, "Created At": formatDate(createdAt) })
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search clients..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <ExportButtons data={exportData} filename="clients" />
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Client
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {["Client ID", "Name", "Email", "Phone", "Country", "Business", "Platform", "Added By", "Date", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-medium text-gray-600 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-gray-400">No clients found</td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-blue-600 font-medium">{c.clientId}</td>
                    <td className="px-4 py-3 font-medium">{c.name}</td>
                    <td className="px-4 py-3 text-gray-600">{c.email}</td>
                    <td className="px-4 py-3 text-gray-600">{c.phone}</td>
                    <td className="px-4 py-3 text-gray-600">{c.country}</td>
                    <td className="px-4 py-3 text-gray-600">{c.businessName}</td>
                    <td className="px-4 py-3 text-gray-600">{c.platform}</td>
                    <td className="px-4 py-3 text-gray-500">{c.user?.name}</td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(c.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => del(c.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={!!modal} onClose={() => setModal(null)} title={modal === "add" ? "Add Client" : "Edit Client"} size="lg">
        {error && <p className="mb-3 text-sm text-red-500 bg-red-50 p-2 rounded-lg">{error}</p>}
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Client Name" required>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass()} placeholder="John Doe" />
          </FormField>
          <FormField label="Email" required>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass()} placeholder="john@example.com" />
          </FormField>
          <FormField label="Phone Number" required>
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputClass()} placeholder="+1 234 567 890" />
          </FormField>
          <FormField label="Country" required>
            <input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className={inputClass()} placeholder="United States" />
          </FormField>
          <FormField label="Business Name" required>
            <input value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} className={inputClass()} placeholder="Acme Corp" />
          </FormField>
          <FormField label="Platform" required>
            <input value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })} className={inputClass()} placeholder="Upwork, Fiverr..." />
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
