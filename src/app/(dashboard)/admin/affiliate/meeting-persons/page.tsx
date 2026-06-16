"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Edit2, UserMinus, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface MeetingPerson {
  id: string;
  name: string;
  email: string;
  active: boolean;
}

function PersonRow({ person, onSaved, onDeactivate }: { person: MeetingPerson; onSaved: () => void; onDeactivate: (id: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(person.name);
  const [email, setEmail] = useState(person.email);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!name.trim() || !email.trim()) return;
    setSaving(true);
    await fetch(`/api/admin/meeting-persons/${person.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email }),
    });
    setSaving(false);
    setEditing(false);
    onSaved();
  };

  const cancel = () => {
    setName(person.name);
    setEmail(person.email);
    setEditing(false);
  };

  if (editing) {
    return (
      <tr className="border-b border-gray-100 bg-blue-50/30">
        <td className="px-4 py-3">
          <input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-2.5 py-1.5 text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400/30 text-gray-700" />
        </td>
        <td className="px-4 py-3">
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="w-full px-2.5 py-1.5 text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400/30 text-gray-700" />
        </td>
        <td className="px-4 py-3">
          <span className={cn("inline-block px-2 py-0.5 rounded text-[11px] font-semibold", person.active ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500")}>
            {person.active ? "Active" : "Inactive"}
          </span>
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-1.5">
            <button onClick={save} disabled={saving} className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors" title="Save">
              {saving ? "…" : <Check className="w-3.5 h-3.5" />}
            </button>
            <button onClick={cancel} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors" title="Cancel">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
      <td className="px-4 py-3.5">
        <p className="text-sm font-semibold text-gray-800">{person.name}</p>
      </td>
      <td className="px-4 py-3.5">
        <p className="text-sm text-gray-600">{person.email}</p>
      </td>
      <td className="px-4 py-3.5">
        <span className={cn("inline-block px-2 py-0.5 rounded text-[11px] font-semibold", person.active ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500")}>
          {person.active ? "Active" : "Inactive"}
        </span>
      </td>
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-1.5">
          <button onClick={() => setEditing(true)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors" title="Edit">
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          {person.active && (
            <button onClick={() => onDeactivate(person.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors" title="Deactivate">
              <UserMinus className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

export default function MeetingPersonsPage() {
  const [persons, setPersons] = useState<MeetingPerson[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");

  const load = useCallback(async () => {
    const data = await fetch("/api/admin/meeting-persons").then((r) => r.json());
    setPersons(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => { load(); }, [load]);

  const addPerson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) { setAddError("Name and email are required"); return; }
    setAdding(true); setAddError("");
    const res = await fetch("/api/admin/meeting-persons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName, email: newEmail }),
    });
    setAdding(false);
    if (!res.ok) {
      const e = await res.json();
      setAddError(e.error ?? "Failed to add");
    } else {
      setNewName(""); setNewEmail(""); setShowAdd(false);
      load();
    }
  };

  const deactivate = async (id: string) => {
    await fetch(`/api/admin/meeting-persons/${id}`, { method: "DELETE" });
    load();
  };

  const active = persons.filter((p) => p.active);
  const inactive = persons.filter((p) => !p.active);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Meeting Persons</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage the list of people who can be added to affiliate meetings</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" /> Add Person
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="bg-white rounded-xl border border-blue-100 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">New Meeting Person</h2>
          <form onSubmit={addPerson} className="flex flex-wrap gap-3 items-end">
            {addError && <p className="w-full text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-100">{addError}</p>}
            <div className="flex-1 min-w-[180px]">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Full Name *</label>
              <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="SM Naymur Rahman Nabil" required className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400/30 text-gray-700 placeholder:text-gray-300" />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Email *</label>
              <input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} type="email" placeholder="person@example.com" required className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400/30 text-gray-700 placeholder:text-gray-300" />
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={adding} className="px-5 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
                {adding ? "Adding…" : "Add"}
              </button>
              <button type="button" onClick={() => { setShowAdd(false); setAddError(""); setNewName(""); setNewEmail(""); }} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Active persons */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">Active ({active.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Name", "Email", "Status", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {active.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-400">No active persons — add one above</td></tr>
              ) : active.map((p) => (
                <PersonRow key={p.id} person={p} onSaved={load} onDeactivate={deactivate} />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inactive persons */}
      {inactive.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden opacity-70">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-500">Inactive ({inactive.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {["Name", "Email", "Status", "Actions"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {inactive.map((p) => (
                  <PersonRow key={p.id} person={p} onSaved={load} onDeactivate={deactivate} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
