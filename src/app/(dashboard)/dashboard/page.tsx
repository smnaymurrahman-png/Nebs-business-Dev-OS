"use client";

import { useEffect, useState } from "react";
import { formatCurrency, formatDate, PROPOSAL_STATUS_LABELS, PRIORITY_LABELS } from "@/lib/utils";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Users, FileText, TrendingUp, CalendarDays, DollarSign } from "lucide-react";

interface DashboardData {
  totalClients: number;
  totalProposals: number;
  totalLeads: number;
  totalMeetings: number;
  totalRevenue: number;
  proposalsByStatus: { currentStatus: string; _count: number }[];
  leadsByStatus: { leadStatus: string; _count: number }[];
  recentProposals: {
    id: string;
    projectName: string;
    amount: number;
    currentStatus: string;
    client: { name: string };
    createdAt: string;
  }[];
  upcomingMeetings: {
    id: string;
    meetingTopic: string;
    meetingDate: string;
    priorityLevel: string;
    assignees: { user: { name: string } }[];
  }[];
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl p-5 border border-gray-200 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then(setData);
  }, []);

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <StatCard label="Total Clients" value={data.totalClients} icon={Users} color="bg-blue-500" />
        <StatCard label="Total Proposals" value={data.totalProposals} icon={FileText} color="bg-purple-500" />
        <StatCard label="Total Leads" value={data.totalLeads} icon={TrendingUp} color="bg-green-500" />
        <StatCard label="Total Meetings" value={data.totalMeetings} icon={CalendarDays} color="bg-orange-500" />
        <StatCard label="Revenue (Completed)" value={formatCurrency(data.totalRevenue)} icon={DollarSign} color="bg-emerald-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Recent Proposals</h3>
          {data.recentProposals.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No proposals yet</p>
          ) : (
            <div className="space-y-3">
              {data.recentProposals.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{p.projectName}</p>
                    <p className="text-xs text-gray-500">{p.client.name} · {formatDate(p.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-700">{formatCurrency(p.amount)}</span>
                    <StatusBadge status={p.currentStatus} label={PROPOSAL_STATUS_LABELS[p.currentStatus] ?? p.currentStatus} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Upcoming Meetings</h3>
          {data.upcomingMeetings.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No upcoming meetings</p>
          ) : (
            <div className="space-y-3">
              {data.upcomingMeetings.map((m) => (
                <div key={m.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{m.meetingTopic}</p>
                    <p className="text-xs text-gray-500">
                      {formatDate(m.meetingDate)} ·{" "}
                      {m.assignees.map((a) => a.user.name).join(", ")}
                    </p>
                  </div>
                  <StatusBadge status={m.priorityLevel} label={PRIORITY_LABELS[m.priorityLevel] ?? m.priorityLevel} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Proposals by Status</h3>
          <div className="space-y-2">
            {data.proposalsByStatus.map((s) => (
              <div key={s.currentStatus} className="flex items-center justify-between">
                <StatusBadge status={s.currentStatus} label={PROPOSAL_STATUS_LABELS[s.currentStatus] ?? s.currentStatus} />
                <span className="text-sm font-semibold">{s._count}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Leads by Status</h3>
          <div className="space-y-2">
            {data.leadsByStatus.map((s) => (
              <div key={s.leadStatus} className="flex items-center justify-between">
                <StatusBadge status={s.leadStatus} label={s.leadStatus.replace(/_/g, " ")} />
                <span className="text-sm font-semibold">{s._count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
