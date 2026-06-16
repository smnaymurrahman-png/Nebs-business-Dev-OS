"use client";

import { useEffect, useState, useCallback } from "react";
import { CalendarDays, Plus, Edit2, XCircle, Clock, CheckCircle2, Users2 } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";

interface Lead { id: string; fullName: string; emailAddress: string }
interface MeetingPerson { id: string; name: string; email: string; active: boolean }
interface Meeting {
  id: string;
  topic: string;
  preferredAt: string | null;
  scheduledAt: string | null;
  requestStatus: string;
  result: string | null;
  locationType: string | null;
  meetingLink: string | null;
  meetingLocation: string | null;
  lead: { fullName: string; emailAddress: string };
  attendees: Array<{ meetingPerson: { id: string; name: string } | null; affiliate: { fullName: string } | null }>;
}

const RESULT_LABELS: Record<string, string> = {
  NOT_INTERESTED: "Not Interested",
  QUOTATION_SENT: "Quotation Sent",
  ONBOARDED: "Onboarded",
  NEED_ANOTHER_MEETING: "Need Another Meeting",
};

const STATUS_LABELS: Record<string, string> = {
  REQUESTED: "Pending",
  APPROVED: "Approved",
  SCHEDULED: "Scheduled",
  CANCELLED: "Cancelled",
};

const STATUS_COLORS: Record<string, string> = {
  REQUESTED: "bg-amber-50 text-amber-700",
  APPROVED: "bg-blue-50 text-blue-700",
  SCHEDULED: "bg-emerald-50 text-emerald-700",
  CANCELLED: "bg-gray-100 text-gray-500",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold", STATUS_COLORS[status] ?? "bg-gray-100 text-gray-500")}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

interface ModalProps {
  leads: Lead[];
  persons: MeetingPerson[];
  onClose: () => void;
  onSaved: () => void;
  editing?: Meeting | null;
}

function RequestModal({ leads, persons, onClose, onSaved, editing }: ModalProps) {
  const [leadId, setLeadId] = useState(editing?.lead ? "" : "");
  const [topic, setTopic] = useState(editing?.topic ?? "");
  const [preferredAt, setPreferredAt] = useState(
    editing?.preferredAt ? editing.preferredAt.slice(0, 16) : ""
  );
  const [selectedPersonIds, setSelectedPersonIds] = useState<Set<string>>(
    new Set(editing?.attendees.map((a) => a.meetingPerson?.id ?? "").filter(Boolean) ?? [])
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // For edit mode, preload the lead from the meeting data
  useEffect(() => {
    if (editing) {
      // We don't have leadId directly, but we show it read-only
    }
  }, [editing]);

  const togglePerson = (id: string) => {
    setSelectedPersonIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing && !leadId) { setError("Select a lead"); return; }
    if (!topic.trim()) { setError("Topic is required"); return; }

    setSaving(true); setError("");
    const body = {
      leadId: editing ? undefined : leadId,
      topic,
      preferredAt: preferredAt || null,
      meetingPersonIds: [...selectedPersonIds],
    };

    const url = editing ? `/api/affiliate/meetings/${editing.id}` : "/api/affiliate/meetings";
    const method = editing ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setSaving(false);

    if (!res.ok) {
      const e = await res.json();
      setError(e.error ?? "Failed to save");
    } else {
      onSaved();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-[2px]" onClick={onClose} />
      <form onSubmit={handleSubmit} className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 rounded-t-2xl">
          <h2 className="text-base font-bold text-gray-900">{editing ? "Edit Meeting Request" : "Request a Meeting"}</h2>
        </div>
        <div className="px-6 py-5 space-y-4">
          {error && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-100">{error}</p>}

          {!editing && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Lead *</label>
              <select value={leadId} onChange={(e) => setLeadId(e.target.value)} required className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400/30 bg-white text-gray-700">
                <option value="">Select a lead…</option>
                {leads.map((l) => <option key={l.id} value={l.id}>{l.fullName} — {l.emailAddress}</option>)}
              </select>
            </div>
          )}

          {editing && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Lead</label>
              <p className="text-sm text-gray-700 font-medium">{editing.lead.fullName}</p>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Topic *</label>
            <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Meeting topic…" required className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400/30 text-gray-700 placeholder:text-gray-300" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Preferred Date & Time</label>
            <input type="datetime-local" value={preferredAt} onChange={(e) => setPreferredAt(e.target.value)} className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400/30 text-gray-700" />
          </div>

          {persons.filter((p) => p.active).length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Preferred Persons</label>
              <div className="space-y-1.5">
                {persons.filter((p) => p.active).map((p) => (
                  <label key={p.id} className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedPersonIds.has(p.id)}
                      onChange={() => togglePerson(p.id)}
                      className="rounded accent-violet-600"
                    />
                    <span className="text-sm text-gray-700">{p.name}</span>
                    <span className="text-xs text-gray-400">{p.email}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="px-6 pb-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors">Cancel</button>
          <button type="submit" disabled={saving} className="px-5 py-2 text-sm font-semibold bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors">
            {saving ? "Saving…" : editing ? "Save Changes" : "Send Request"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function AffiliateMeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [persons, setPersons] = useState<MeetingPerson[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    const [m, l, p] = await Promise.all([
      fetch("/api/affiliate/meetings").then((r) => r.json()),
      fetch("/api/affiliate/leads").then((r) => r.json()),
      fetch("/api/affiliate/meeting-persons").then((r) => r.json()),
    ]);
    setMeetings(Array.isArray(m) ? m : []);
    setLeads(Array.isArray(l) ? l : []);
    setPersons(Array.isArray(p) ? p : []);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const cancelMeeting = async (id: string) => {
    setCancelling(id);
    await fetch(`/api/affiliate/meetings/${id}`, { method: "DELETE" });
    setCancelling(null);
    loadAll();
  };

  const pending = meetings.filter((m) => m.requestStatus === "REQUESTED");
  const upcoming = meetings.filter((m) => m.requestStatus === "SCHEDULED");
  const past = meetings.filter((m) => m.requestStatus === "CANCELLED" || m.result);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Meetings</h1>
          <p className="text-sm text-gray-500 mt-0.5">Request and track your meetings with the Nebs team</p>
        </div>
        <button onClick={() => { setEditingMeeting(null); setShowModal(true); }} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors">
          <Plus className="w-4 h-4" /> Request Meeting
        </button>
      </div>

      {/* Pending Requests */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4" /> Pending Requests
        </h2>
        {pending.length === 0 ? (
          <p className="text-sm text-gray-400 py-4">No pending requests</p>
        ) : (
          <div className="space-y-3">
            {pending.map((m) => (
              <div key={m.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800">{m.topic}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Lead: {m.lead.fullName}</p>
                    {m.preferredAt && (
                      <p className="text-xs text-gray-400 mt-1">Preferred: {formatDate(m.preferredAt)}</p>
                    )}
                    {m.attendees.filter((a) => a.meetingPerson).length > 0 && (
                      <p className="text-xs text-gray-400 mt-1">
                        Preferred persons: {m.attendees.filter((a) => a.meetingPerson).map((a) => a.meetingPerson!.name).join(", ")}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <StatusBadge status={m.requestStatus} />
                    <button onClick={() => { setEditingMeeting(m); setShowModal(true); }} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors" title="Edit">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => cancelMeeting(m.id)} disabled={cancelling === m.id} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors" title="Cancel">
                      <XCircle className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Upcoming Meetings */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> Upcoming Meetings
        </h2>
        {upcoming.length === 0 ? (
          <p className="text-sm text-gray-400 py-4">No scheduled meetings</p>
        ) : (
          <div className="space-y-3">
            {upcoming.map((m) => (
              <div key={m.id} className="bg-white rounded-xl border border-emerald-100 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800">{m.topic}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Lead: {m.lead.fullName}</p>
                    {m.scheduledAt && (
                      <p className="text-xs font-medium text-emerald-700 mt-1">📅 {formatDate(m.scheduledAt)}</p>
                    )}
                    {m.locationType === "ONLINE" && m.meetingLink && (
                      <a href={m.meetingLink} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline mt-1 block">Join online meeting →</a>
                    )}
                    {m.locationType === "OFFLINE" && m.meetingLocation && (
                      <p className="text-xs text-gray-500 mt-1">📍 {m.meetingLocation}</p>
                    )}
                    {m.attendees.length > 0 && (
                      <div className="flex items-center gap-1 mt-2">
                        <Users2 className="w-3 h-3 text-gray-400" />
                        <p className="text-xs text-gray-400">
                          {m.attendees.map((a) => a.meetingPerson?.name ?? a.affiliate?.fullName).filter(Boolean).join(", ")}
                        </p>
                      </div>
                    )}
                    {m.result && (
                      <p className="text-xs font-semibold text-violet-700 mt-2">Result: {RESULT_LABELS[m.result] ?? m.result}</p>
                    )}
                  </div>
                  <StatusBadge status={m.requestStatus} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Past / Cancelled */}
      {past.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <CalendarDays className="w-4 h-4" /> Past & Cancelled
          </h2>
          <div className="space-y-2">
            {past.map((m) => (
              <div key={m.id} className="bg-gray-50 rounded-xl border border-gray-100 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{m.topic}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Lead: {m.lead.fullName}</p>
                    {m.result && <p className="text-xs text-gray-500 mt-1">Result: {RESULT_LABELS[m.result] ?? m.result}</p>}
                  </div>
                  <StatusBadge status={m.requestStatus} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {showModal && (
        <RequestModal
          leads={leads}
          persons={persons}
          onClose={() => { setShowModal(false); setEditingMeeting(null); }}
          onSaved={loadAll}
          editing={editingMeeting}
        />
      )}
    </div>
  );
}
