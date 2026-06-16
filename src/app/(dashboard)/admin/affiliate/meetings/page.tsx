"use client";

import { useEffect, useState, useCallback } from "react";
import { CalendarDays, Plus, CheckCircle, Clock, Users2, Link2, MapPin } from "lucide-react";
import { cn, LEAD_STATUS_LABELS, formatDate } from "@/lib/utils";

interface LeadMeta { fullName: string; emailAddress: string; businessName: string; affiliateId: string | null; leadStatus: string; commission: { id: string } | null }
interface AffiliateMeta { fullName: string; email: string; affiliateCode: string }
interface PersonAttendee { id: string; name: string; email: string }

interface AffiliateMeeting {
  id: string;
  topic: string;
  preferredAt: string | null;
  scheduledAt: string | null;
  requestStatus: string;
  result: string | null;
  locationType: string | null;
  meetingLink: string | null;
  meetingLocation: string | null;
  createdAt: string;
  lead: LeadMeta;
  affiliate: AffiliateMeta;
  attendees: Array<{
    meetingPerson: PersonAttendee | null;
    affiliate: { id: string; fullName: string; email: string } | null;
  }>;
}

interface MeetingPerson { id: string; name: string; email: string; active: boolean }
interface Lead { id: string; fullName: string; emailAddress: string; businessName: string; affiliateId: string | null }

const RESULT_LABELS: Record<string, string> = {
  NOT_INTERESTED: "Not Interested",
  QUOTATION_SENT: "Quotation Sent",
  ONBOARDED: "Onboarded",
  NEED_ANOTHER_MEETING: "Need Another Meeting",
};

const RESULT_COLORS: Record<string, string> = {
  NOT_INTERESTED: "bg-red-50 text-red-700",
  QUOTATION_SENT: "bg-blue-50 text-blue-700",
  ONBOARDED: "bg-emerald-50 text-emerald-700",
  NEED_ANOTHER_MEETING: "bg-amber-50 text-amber-700",
};

const STATUS_COLORS: Record<string, string> = {
  REQUESTED: "bg-amber-50 text-amber-700",
  APPROVED: "bg-blue-50 text-blue-700",
  SCHEDULED: "bg-emerald-50 text-emerald-700",
  CANCELLED: "bg-gray-100 text-gray-400",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold", STATUS_COLORS[status] ?? "bg-gray-100 text-gray-500")}>
      {status}
    </span>
  );
}

interface ScheduleModalProps {
  meeting: AffiliateMeeting | null;
  persons: MeetingPerson[];
  allLeads: Lead[];
  onClose: () => void;
  onSaved: () => void;
  isNew?: boolean;
}

function ScheduleModal({ meeting, persons, allLeads, onClose, onSaved, isNew }: ScheduleModalProps) {
  const [leadId, setLeadId] = useState(meeting?.lead ? (allLeads.find((l) => l.fullName === meeting.lead.fullName)?.id ?? "") : "");
  const [topic, setTopic] = useState(meeting?.topic ?? "");
  const [scheduledAt, setScheduledAt] = useState(meeting?.scheduledAt ? meeting.scheduledAt.slice(0, 16) : "");
  const [locationType, setLocationType] = useState(meeting?.locationType ?? "");
  const [meetingLink, setMeetingLink] = useState(meeting?.meetingLink ?? "");
  const [meetingLocation, setMeetingLocation] = useState(meeting?.meetingLocation ?? "");
  const [selectedPersonIds, setSelectedPersonIds] = useState<Set<string>>(
    new Set(meeting?.attendees.map((a) => a.meetingPerson?.id ?? "").filter(Boolean) ?? [])
  );
  const [includeAffiliate, setIncludeAffiliate] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

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
    if (!scheduledAt || !locationType) { setError("Date, time, and location type are required"); return; }
    if (locationType === "ONLINE" && !meetingLink) { setError("Meeting link required for online"); return; }
    if (locationType === "OFFLINE" && !meetingLocation) { setError("Location required for offline"); return; }

    setSaving(true); setError("");
    const body = {
      ...(isNew && { leadId, topic, scheduledAt, locationType, meetingLink: locationType === "ONLINE" ? meetingLink : null, meetingLocation: locationType === "OFFLINE" ? meetingLocation : null, meetingPersonIds: [...selectedPersonIds], includeAffiliate }),
      ...(!isNew && { action: "schedule", scheduledAt, locationType, meetingLink: locationType === "ONLINE" ? meetingLink : null, meetingLocation: locationType === "OFFLINE" ? meetingLocation : null, meetingPersonIds: [...selectedPersonIds], includeAffiliate }),
    };

    const url = isNew ? "/api/admin/affiliate/meetings" : `/api/admin/affiliate/meetings/${meeting!.id}`;
    const method = isNew ? "POST" : "PUT";

    if (isNew && (!leadId || !topic)) { setError("Lead and topic are required"); setSaving(false); return; }

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
          <h2 className="text-base font-bold text-gray-900">{isNew ? "Create Meeting" : "Schedule Meeting"}</h2>
          {meeting && <p className="text-xs text-gray-500 mt-0.5">Lead: {meeting.lead.fullName} · Affiliate: {meeting.affiliate.fullName}</p>}
        </div>

        <div className="px-6 py-5 space-y-4">
          {error && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-100">{error}</p>}

          {isNew && (
            <>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Lead *</label>
                <select value={leadId} onChange={(e) => setLeadId(e.target.value)} required className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400/30 bg-white text-gray-700">
                  <option value="">Select a lead…</option>
                  {allLeads.map((l) => <option key={l.id} value={l.id}>{l.fullName} — {l.businessName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Topic *</label>
                <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Meeting topic…" required className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400/30 text-gray-700 placeholder:text-gray-300" />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Date & Time *</label>
            <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} required className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400/30 text-gray-700" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Location Type *</label>
            <div className="flex gap-2">
              {["ONLINE", "OFFLINE"].map((lt) => (
                <button key={lt} type="button" onClick={() => setLocationType(lt)}
                  className={cn("flex-1 py-2 text-xs rounded-lg border font-semibold transition-colors", locationType === lt ? "border-blue-400 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-600 hover:border-gray-300")}>
                  {lt === "ONLINE" ? "Online" : "Offline"}
                </button>
              ))}
            </div>
          </div>

          {locationType === "ONLINE" && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Meeting Link *</label>
              <input value={meetingLink} onChange={(e) => setMeetingLink(e.target.value)} placeholder="https://…" className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400/30 text-gray-700 placeholder:text-gray-300" />
            </div>
          )}

          {locationType === "OFFLINE" && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Location *</label>
              <input value={meetingLocation} onChange={(e) => setMeetingLocation(e.target.value)} placeholder="Office address…" className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400/30 text-gray-700 placeholder:text-gray-300" />
            </div>
          )}

          {persons.filter((p) => p.active).length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Add Meeting Persons</label>
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {persons.filter((p) => p.active).map((p) => (
                  <label key={p.id} className="flex items-center gap-2.5 cursor-pointer">
                    <input type="checkbox" checked={selectedPersonIds.has(p.id)} onChange={() => togglePerson(p.id)} className="rounded accent-blue-600" />
                    <span className="text-sm text-gray-700">{p.name}</span>
                    <span className="text-xs text-gray-400">{p.email}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <label className="flex items-center gap-2.5 cursor-pointer">
            <input type="checkbox" checked={includeAffiliate} onChange={(e) => setIncludeAffiliate(e.target.checked)} className="rounded accent-blue-600" />
            <span className="text-sm text-gray-700">Include affiliate in email invite</span>
          </label>
        </div>

        <div className="px-6 pb-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800">Cancel</button>
          <button type="submit" disabled={saving} className="px-5 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
            {saving ? "Saving…" : "Confirm & Notify"}
          </button>
        </div>
      </form>
    </div>
  );
}

interface ResultModalProps {
  meeting: AffiliateMeeting;
  onClose: () => void;
  onSaved: () => void;
}

function ResultModal({ meeting, onClose, onSaved }: ResultModalProps) {
  const [result, setResult] = useState<string>("");
  const [dealValue, setDealValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const RESULTS = [
    { value: "NOT_INTERESTED",      label: "Not Interested",      desc: "→ Lead Rejected" },
    { value: "QUOTATION_SENT",      label: "Quotation Sent",      desc: "→ Lead Quotation Sent" },
    { value: "ONBOARDED",           label: "Onboarded",           desc: "→ Lead Onboarded + Commission" },
    { value: "NEED_ANOTHER_MEETING",label: "Need Another Meeting",desc: "→ Lead stays in pipeline" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!result) { setError("Select a result"); return; }
    if (result === "ONBOARDED" && (!dealValue || parseFloat(dealValue) <= 0)) { setError("Enter a deal value"); return; }

    setSaving(true); setError("");
    const res = await fetch(`/api/admin/affiliate/meetings/${meeting.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "set_result", result, dealValue }),
    });
    setSaving(false);
    if (!res.ok) {
      const e = await res.json();
      setError(e.error ?? "Failed");
    } else {
      onSaved();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-[2px]" onClick={onClose} />
      <form onSubmit={handleSubmit} className="relative bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">Set Meeting Result</h2>
          <p className="text-xs text-gray-500 mt-0.5">{meeting.topic} · {meeting.lead.fullName}</p>
        </div>
        <div className="px-6 py-5 space-y-3">
          {error && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-100">{error}</p>}
          {RESULTS.map((r) => (
            <button key={r.value} type="button" onClick={() => setResult(r.value)}
              className={cn("w-full text-left px-4 py-3 rounded-xl border transition-all", result === r.value ? "border-blue-400 bg-blue-50" : "border-gray-200 hover:border-gray-300")}>
              <p className={cn("text-sm font-semibold", result === r.value ? "text-blue-700" : "text-gray-700")}>{r.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{r.desc}</p>
            </button>
          ))}

          {result === "ONBOARDED" && !meeting.lead.commission && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Deal Value (USD) *</label>
              <input type="number" min="0" step="0.01" value={dealValue} onChange={(e) => setDealValue(e.target.value)}
                placeholder="e.g. 2500.00"
                className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400/30 text-gray-700 placeholder:text-gray-300" />
              {dealValue && parseFloat(dealValue) > 0 && (
                <p className="text-xs text-emerald-600 mt-1.5">Commission: ${(parseFloat(dealValue) * 0.15).toFixed(2)} (15%)</p>
              )}
            </div>
          )}

          {result === "ONBOARDED" && meeting.lead.commission && (
            <p className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg border border-amber-100">This lead already has a commission record.</p>
          )}
        </div>
        <div className="px-6 pb-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800">Cancel</button>
          <button type="submit" disabled={saving || !result} className="px-5 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
            {saving ? "Saving…" : "Set Result"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function AdminMeetingsPage() {
  const [meetings, setMeetings] = useState<AffiliateMeeting[]>([]);
  const [persons, setPersons] = useState<MeetingPerson[]>([]);
  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [tab, setTab] = useState<"queue" | "all">("queue");
  const [scheduleTarget, setScheduleTarget] = useState<AffiliateMeeting | null>(null);
  const [resultTarget, setResultTarget] = useState<AffiliateMeeting | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);

  const load = useCallback(async () => {
    const view = tab === "queue" ? "queue" : "all";
    const [m, p, l] = await Promise.all([
      fetch(`/api/admin/affiliate/meetings?view=${view}`).then((r) => r.json()),
      fetch("/api/admin/meeting-persons").then((r) => r.json()),
      fetch("/api/leads").then((r) => r.json()),
    ]);
    setMeetings(Array.isArray(m) ? m : []);
    setPersons(Array.isArray(p) ? p : []);
    setAllLeads(Array.isArray(l) ? l : []);
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Affiliate Meetings</h1>
          <p className="text-sm text-gray-500 mt-0.5">Review requests and schedule meetings</p>
        </div>
        <button onClick={() => setShowNewModal(true)} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" /> New Meeting
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {([["queue", "Requests"], ["all", "All Meetings"]] as const).map(([v, l]) => (
          <button key={v} onClick={() => setTab(v)}
            className={cn("px-4 py-1.5 text-xs font-semibold rounded-md transition-colors", tab === v ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700")}>
            {l}
          </button>
        ))}
      </div>

      {/* Meetings table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Lead", "Affiliate", "Topic", "Preferred / Scheduled", "Status", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {meetings.length === 0 ? (
                <tr><td colSpan={6}>
                  <div className="flex flex-col items-center py-16 text-gray-400">
                    <CalendarDays className="w-8 h-8 text-gray-200 mb-2" />
                    <p className="text-sm">{tab === "queue" ? "No pending requests" : "No meetings"}</p>
                  </div>
                </td></tr>
              ) : meetings.map((m) => (
                <tr key={m.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3.5">
                    <p className="text-sm font-semibold text-gray-800">{m.lead.fullName}</p>
                    <p className="text-xs text-gray-400">{m.lead.businessName}</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="text-sm text-gray-700">{m.affiliate.fullName}</p>
                    <p className="text-xs text-gray-400 font-mono">{m.affiliate.affiliateCode}</p>
                  </td>
                  <td className="px-4 py-3.5 text-sm text-gray-600 max-w-[200px] truncate">{m.topic}</td>
                  <td className="px-4 py-3.5 text-xs text-gray-500">
                    {m.preferredAt && <p className="flex items-center gap-1"><Clock className="w-3 h-3" /> Preferred: {formatDate(m.preferredAt)}</p>}
                    {m.scheduledAt && <p className="flex items-center gap-1 text-emerald-600 font-medium"><CheckCircle className="w-3 h-3" /> {formatDate(m.scheduledAt)}</p>}
                    {m.locationType === "ONLINE" && m.meetingLink && <p className="flex items-center gap-1"><Link2 className="w-3 h-3" /> Online</p>}
                    {m.locationType === "OFFLINE" && m.meetingLocation && <p className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {m.meetingLocation}</p>}
                    {m.attendees.length > 0 && (
                      <p className="flex items-center gap-1 mt-0.5">
                        <Users2 className="w-3 h-3" />
                        {m.attendees.map((a) => a.meetingPerson?.name ?? a.affiliate?.fullName).filter(Boolean).join(", ")}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusBadge status={m.requestStatus} />
                    {m.result && (
                      <span className={cn("mt-1 flex items-center px-2 py-0.5 rounded text-[11px] font-semibold", RESULT_COLORS[m.result] ?? "bg-gray-100 text-gray-500")}>
                        {RESULT_LABELS[m.result]}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5">
                      {m.requestStatus === "REQUESTED" && (
                        <button onClick={() => setScheduleTarget(m)}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100 rounded-lg hover:bg-blue-100 transition-colors">
                          <CalendarDays className="w-3.5 h-3.5" /> Schedule
                        </button>
                      )}
                      {m.requestStatus === "SCHEDULED" && !m.result && (
                        <button onClick={() => setResultTarget(m)}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg hover:bg-emerald-100 transition-colors">
                          Set Result
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {scheduleTarget && (
        <ScheduleModal
          meeting={scheduleTarget}
          persons={persons}
          allLeads={allLeads}
          onClose={() => setScheduleTarget(null)}
          onSaved={load}
        />
      )}

      {resultTarget && (
        <ResultModal
          meeting={resultTarget}
          onClose={() => setResultTarget(null)}
          onSaved={load}
        />
      )}

      {showNewModal && (
        <ScheduleModal
          meeting={null}
          persons={persons}
          allLeads={allLeads}
          onClose={() => setShowNewModal(false)}
          onSaved={load}
          isNew
        />
      )}
    </div>
  );
}
