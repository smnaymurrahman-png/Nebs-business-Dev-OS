"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/shared/Modal";
import { FormField, inputClass, selectClass } from "@/components/shared/FormField";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatDate, PRIORITY_LABELS } from "@/lib/utils";
import { Plus, Trash2, Search, Calendar } from "lucide-react";

interface User {
  id: string;
  name: string;
}

interface Meeting {
  id: string;
  meetingDate: string;
  meetingTopic: string;
  priorityLevel: string;
  createdAt: string;
  user?: { name: string };
  assignees: { user: { id: string; name: string } }[];
}

const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];
const emptyForm = { meetingDate: "", meetingTopic: "", priorityLevel: "MEDIUM", assigneeIds: [] as string[] };

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = () => fetch("/api/meetings").then((r) => r.json()).then(setMeetings);
  const loadUsers = () => fetch("/api/users").then((r) => r.json()).then(setUsers).catch(() => {});

  useEffect(() => { load(); loadUsers(); }, []);

  const filtered = meetings.filter((m) =>
    m.meetingTopic.toLowerCase().includes(search.toLowerCase())
  );

  const toggleAssignee = (id: string) => {
    setForm((f) => ({
      ...f,
      assigneeIds: f.assigneeIds.includes(id)
        ? f.assigneeIds.filter((i) => i !== id)
        : [...f.assigneeIds, id],
    }));
  };

  const save = async () => {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/meetings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) { const e = await res.json(); setError(e.error ?? "Error"); return; }
      await load(); setModal(false); setForm(emptyForm);
    } finally { setLoading(false); }
  };

  const del = async (id: string) => {
    if (!confirm("Delete this meeting?")) return;
    await fetch(`/api/meetings/${id}`, { method: "DELETE" });
    load();
  };

  const now = new Date();
  const upcoming = filtered.filter((m) => new Date(m.meetingDate) >= now);
  const past = filtered.filter((m) => new Date(m.meetingDate) < now);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search meetings..." className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400 bg-gray-50/50" />
        </div>
        <button onClick={() => { setForm(emptyForm); setError(""); setModal(true); }} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-semibold rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all shadow-sm">
          <Plus className="w-4 h-4" />Request Meeting
        </button>
      </div>

      {upcoming.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-600 mb-3">Upcoming Meetings ({upcoming.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {upcoming.map((m) => (
              <div key={m.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-gray-800">{m.meetingTopic}</p>
                    <p className="text-xs text-gray-500 mt-0.5">By {m.user?.name}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <StatusBadge status={m.priorityLevel} label={PRIORITY_LABELS[m.priorityLevel] ?? m.priorityLevel} />
                    <button onClick={() => del(m.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 ml-1"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{new Date(m.meetingDate).toLocaleString()}</span>
                </div>
                {m.assignees.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {m.assignees.map(({ user }) => (
                      <span key={user.id} className="px-2 py-0.5 bg-violet-50 text-violet-700 rounded-full text-xs">{user.name}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {past.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-500 mb-3">Past Meetings ({past.length})</h3>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50/80 border-b border-gray-100">
                  <tr>
                    {["Topic", "Date", "Priority", "Assignees", "By", ""].map((h) => (
                      <th key={h} className="px-4 py-3 text-left font-medium text-gray-600 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {past.map((m) => (
                    <tr key={m.id} className="hover:bg-gray-50 opacity-70">
                      <td className="px-4 py-3 font-medium">{m.meetingTopic}</td>
                      <td className="px-4 py-3 text-gray-500">{new Date(m.meetingDate).toLocaleString()}</td>
                      <td className="px-4 py-3"><StatusBadge status={m.priorityLevel} label={PRIORITY_LABELS[m.priorityLevel]} /></td>
                      <td className="px-4 py-3 text-gray-600">{m.assignees.map((a) => a.user.name).join(", ")}</td>
                      <td className="px-4 py-3 text-gray-500">{m.user?.name}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => del(m.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center text-gray-400">
          No meetings scheduled yet
        </div>
      )}

      <Modal isOpen={modal} onClose={() => setModal(false)} title="Request Meeting" size="md">
        {error && <p className="mb-3 text-sm text-red-600 bg-red-50 p-3 rounded-xl font-medium">{error}</p>}
        <div className="space-y-4">
          <FormField label="Meeting Date & Time" required>
            <input type="datetime-local" value={form.meetingDate} onChange={(e) => setForm({ ...form, meetingDate: e.target.value })} className={inputClass()} />
          </FormField>
          <FormField label="Meeting Topic" required>
            <input value={form.meetingTopic} onChange={(e) => setForm({ ...form, meetingTopic: e.target.value })} className={inputClass()} placeholder="Topic of the meeting..." />
          </FormField>
          <FormField label="Priority Level" required>
            <select value={form.priorityLevel} onChange={(e) => setForm({ ...form, priorityLevel: e.target.value })} className={selectClass()}>
              {PRIORITIES.map((p) => (<option key={p} value={p}>{PRIORITY_LABELS[p]}</option>))}
            </select>
          </FormField>
          <FormField label="Assign People">
            <div className="border border-gray-200 rounded-xl p-3 space-y-2 max-h-40 overflow-y-auto">
              {users.length === 0 ? (
                <p className="text-xs text-gray-400">No team members available</p>
              ) : (
                users.map((u) => (
                  <label key={u.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.assigneeIds.includes(u.id)}
                      onChange={() => toggleAssignee(u.id)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">{u.name}</span>
                  </label>
                ))
              )}
            </div>
          </FormField>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={() => setModal(false)} className="px-4 py-2 text-sm font-medium border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600">Cancel</button>
          <button onClick={save} disabled={loading} className="px-4 py-2 text-sm font-semibold bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl hover:from-violet-700 hover:to-indigo-700 disabled:opacity-60 transition-all shadow-sm">
            {loading ? "Saving..." : "Submit"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
