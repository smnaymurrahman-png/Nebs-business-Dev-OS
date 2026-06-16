"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Edit2, Trash2, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface RefItem { id: string; name: string; active: boolean }

function RefTable({
  title, items, apiBase, onChanged,
}: { title: string; items: RefItem[]; apiBase: string; onChanged: () => void }) {
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [saving, setSaving] = useState(false);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setAdding(true);
    await fetch(apiBase, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newName }) });
    setAdding(false); setNewName(""); setShowAdd(false); onChanged();
  };

  const saveEdit = async (id: string) => {
    if (!editName.trim()) return;
    setSaving(true);
    await fetch(`${apiBase}/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: editName }) });
    setSaving(false); setEditId(null); onChanged();
  };

  const toggle = async (item: RefItem) => {
    await fetch(`${apiBase}/${item.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active: !item.active }) });
    onChanged();
  };

  const remove = async (id: string) => {
    await fetch(`${apiBase}/${id}`, { method: "DELETE" });
    onChanged();
  };

  const field = "px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400/30 text-gray-700 placeholder:text-gray-300";

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-700">{title} ({items.filter((i) => i.active).length} active)</h2>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-100 rounded-lg hover:bg-blue-100 transition-colors">
          <Plus className="w-3.5 h-3.5" /> Add
        </button>
      </div>

      {showAdd && (
        <form onSubmit={add} className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-blue-50/30">
          <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder={`New ${title.slice(0, -1)}…`} autoFocus className={`flex-1 ${field}`} />
          <button type="submit" disabled={adding} className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors">
            <Check className="w-3.5 h-3.5" />
          </button>
          <button type="button" onClick={() => { setShowAdd(false); setNewName(""); }} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </form>
      )}

      <table className="w-full">
        <tbody>
          {items.length === 0 ? (
            <tr><td className="px-4 py-8 text-center text-sm text-gray-400">No items yet</td></tr>
          ) : items.map((item) => (
            <tr key={item.id} className={cn("border-b border-gray-100 last:border-0", !item.active && "opacity-50")}>
              <td className="px-4 py-3">
                {editId === item.id ? (
                  <div className="flex items-center gap-2">
                    <input value={editName} onChange={(e) => setEditName(e.target.value)} autoFocus className={`flex-1 ${field}`} />
                    <button onClick={() => saveEdit(item.id)} disabled={saving} className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors">
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setEditId(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-gray-700">{item.name}</span>
                    <div className="flex items-center gap-1">
                      <button onClick={() => { setEditId(item.id); setEditName(item.name); }} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => toggle(item)} className="px-2 py-1 text-[10px] font-semibold rounded transition-colors"
                        title={item.active ? "Deactivate" : "Activate"}>
                        {item.active ? <span className="text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">Deactivate</span> : <span className="text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">Activate</span>}
                      </button>
                      <button onClick={() => remove(item.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function ReferencesPage() {
  const [industries, setIndustries] = useState<RefItem[]>([]);
  const [serviceTypes, setServiceTypes] = useState<RefItem[]>([]);

  const load = useCallback(async () => {
    const [i, s] = await Promise.all([
      fetch("/api/admin/industries").then((r) => r.json()),
      fetch("/api/admin/service-types").then((r) => r.json()),
    ]);
    setIndustries(Array.isArray(i) ? i : []);
    setServiceTypes(Array.isArray(s) ? s : []);
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Reference Lists</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage the Industries and Service Types dropdowns used across the system</p>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <RefTable title="Industries" items={industries} apiBase="/api/admin/industries" onChanged={load} />
        <RefTable title="Service Types" items={serviceTypes} apiBase="/api/admin/service-types" onChanged={load} />
      </div>
    </div>
  );
}
