"use client";

import { useEffect, useState } from "react";
import { type ComponentType } from "react";
import { Modal } from "@/components/shared/Modal";
import { FormField, inputClass, selectClass } from "@/components/shared/FormField";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatDate, PRIORITY_LABELS } from "@/lib/utils";
import { Plus, Trash2, Search, Calendar, CalendarClock, CalendarCheck, CalendarX, AlertCircle } from "lucide-react";

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

const PRIORITY_CARD_STYLES: Record<string, string> = {
  URGENT: "border-l-4 border-l-red-400",
  HIGH: "border-l-4 border-l-orange-400",
  MEDIUM: "border-l-4 border-l-blue-400",
  LOW: "border-l-4 border-l-slate-300",
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
  const urgent = meetings.filter((m) => m.priorityLevel === "URGENT" && new Date(m.meetingDate) >= now).length;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard icon={CalendarClock} label="Total Meetings" value={meetings.length} iconBg="bg-gradient-to-br from-violet-50 to-violet-100" iconColor="text-violet-600" />
        <StatCard icon={CalendarCheck} label="Upcoming" value={meetings.filter((m) => new Date(m.meetingDate) >= now).length} iconBg="bg-gradient-to-br from-emerald-50 to-emerald-100" iconColor="text-emerald-600" />
        <StatCard icon={CalendarX} label="Past" value={meetings.filter((m) => new Date(m.meetingDate) < now).length} iconBg="bg-gradient-to-br from-slate-50 to-slate-100" iconColor="text-slate-500" />
        <StatCard icon={AlertCircle} label="Urgent" value={urgent} iconBg="bg-gradient-to-br from-red-50 to-orange-50" iconColor="text-red-500" />
      </div>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search meetings..." className="pl-8 pr-3 py-2 text-[13px] font-medium border border-[#E2E8F0] rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400/40 focus:border-violet-300 bg-white placeholder:text-slate-300 text-slate-700 shadow-sm w-60 transition-all" />
        </div>
        <button onClick={() => { setForm(emptyForm); setError(""); setModal(true); }} className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-[13px] font-semibold rounded-xl hover:from-violet-700 hover:to-indigo-700 shadow-md shadow-violet-200 hover:shadow-lg hover:shadow-violet-300/50 active:scale-[0.98] transition-all">
          <Plus className="w-4 h-4" />Request Meeting
        </button>
      </div>

      {upcoming.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-[13px] font-semibold text-slate-700">Upcoming</h3>
            <span className="bg-emerald-100 text-emerald-700 text-[11px] px-2 py-0.5 rounded-full font-semibold">{upcoming.length}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {upcoming.map((m) => (
              <div key={m.id} className={`group bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-4 space-y-3 hover:shadow-md transition-shadow ${PRIORITY_CARD_STYLES[m.priorityLevel] ?? ""}`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[13px] font-semibold text-slate-800">{m.meetingTopic}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">By {m.user?.name}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <StatusBadge status={m.priorityLevel} label={PRIORITY_LABELS[m.priorityLevel] ?? m.priorityLevel} />
                    <button onClick={() => del(m.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all ml-1"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[12px] text-slate-500">
                  <Calendar className="w-3.5 h-3.5 text-violet-400" />
                  <span>{new Date(m.meetingDate).toLocaleString()}</span>
                </div>
                {m.assignees.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {m.assignees.map(({ user }) => (
                      <span key={user.id} className="px-2 py-0.5 bg-violet-50 text-violet-700 rounded-full text-[11px] font-medium">{user.name}</span>
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
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-[13px] font-semibold text-slate-500">Past Meetings</h3>
            <span className="bg-slate-100 text-slate-500 text-[11px] px-2 py-0.5 rounded-full font-semibold">{past.length}</span>
          </div>
          <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#F8FAFC] border-b border-[#F1F5F9]">
                  <tr>
                    {["Topic", "Date", "Priority", "Assignees", "By", ""].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {past.map((m) => (
                    <tr key={m.id} className="group border-b border-[#F1F5F9] opacity-70 hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3.5 text-[13px] font-medium text-slate-600">{m.meetingTopic}</td>
                      <td className="px-5 py-3.5 text-[12px] text-slate-500 whitespace-nowrap">{new Date(m.meetingDate).toLocaleString()}</td>
                      <td className="px-5 py-3.5"><StatusBadge status={m.priorityLevel} label={PRIORITY_LABELS[m.priorityLevel]} /></td>
                      <td className="px-5 py-3.5 text-[12px] text-slate-500">{m.assignees.map((a) => a.user.name).join(", ") || <span className="text-slate-300">—</span>}</td>
                      <td className="px-5 py-3.5 text-[12px] text-slate-500">{m.user?.name}</td>
                      <td className="px-5 py-3.5">
                        <button onClick={() => del(m.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
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
        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm">
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
              <CalendarClock className="w-6 h-6 text-slate-300" />
            </div>
            <p className="text-sm font-medium text-slate-500">No meetings scheduled</p>
            <p className="text-xs mt-1">Request a meeting to get started</p>
          </div>
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
            <div className="border border-[#E2E8F0] rounded-xl p-3 space-y-2 max-h-40 overflow-y-auto">
              {users.length === 0 ? (
                <p className="text-xs text-slate-400">No team members available</p>
              ) : (
                users.map((u) => (
                  <label key={u.id} className="flex items-center gap-2.5 cursor-pointer py-0.5">
                    <input
                      type="checkbox"
                      checked={form.assigneeIds.includes(u.id)}
                      onChange={() => toggleAssignee(u.id)}
                      className="rounded border-slate-300 accent-violet-600"
                    />
                    <span className="text-[13px] text-slate-700 font-medium">{u.name}</span>
                  </label>
                ))
              )}
            </div>
          </FormField>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={() => setModal(false)} className="px-4 py-2 text-sm font-medium border border-[#E2E8F0] rounded-xl hover:bg-slate-50 text-slate-600">Cancel</button>
          <button onClick={save} disabled={loading} className="px-5 py-2 text-sm font-semibold bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl hover:from-violet-700 hover:to-indigo-700 disabled:opacity-60 transition-all shadow-sm shadow-violet-200">
            {loading ? "Saving..." : "Submit"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
