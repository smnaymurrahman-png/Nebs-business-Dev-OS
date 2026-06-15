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

const statCards = [
  {
    key: "totalClients" as const,
    label: "Total Clients",
    icon: Users,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  {
    key: "totalProposals" as const,
    label: "Proposals",
    icon: FileText,
    iconBg: "bg-sky-50",
    iconColor: "text-sky-600",
  },
  {
    key: "totalLeads" as const,
    label: "Total Leads",
    icon: TrendingUp,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
  },
  {
    key: "totalMeetings" as const,
    label: "Meetings",
    icon: CalendarDays,
    iconBg: "bg-orange-50",
    iconColor: "text-orange-600",
  },
  {
    key: "totalRevenue" as const,
    label: "Revenue",
    icon: DollarSign,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
    currency: true,
  },
];

function StatCard({
  label,
  value,
  icon: Icon,
  iconBg,
  iconColor,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center flex-shrink-0`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <div>
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-gray-900 leading-tight mt-0.5">{value}</p>
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
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        {statCards.map((card) => (
          <StatCard
            key={card.key}
            label={card.label}
            value={card.currency ? formatCurrency(data[card.key] as number) : data[card.key]}
            icon={card.icon}
            iconBg={card.iconBg}
            iconColor={card.iconColor}
          />
        ))}
      </div>

      {/* Recent Proposals + Upcoming Meetings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-[13px] font-semibold text-gray-800 mb-4">Recent Proposals</h3>
          {data.recentProposals.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No proposals yet</p>
          ) : (
            <div className="space-y-3">
              {data.recentProposals.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-[13px] font-semibold text-gray-800">{p.projectName}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{p.client.name} · {formatDate(p.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-3 shrink-0">
                    <span className="text-[13px] font-bold text-gray-700">{formatCurrency(p.amount)}</span>
                    <StatusBadge status={p.currentStatus} label={PROPOSAL_STATUS_LABELS[p.currentStatus] ?? p.currentStatus} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-[13px] font-semibold text-gray-800 mb-4">Upcoming Meetings</h3>
          {data.upcomingMeetings.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No upcoming meetings</p>
          ) : (
            <div className="space-y-3">
              {data.upcomingMeetings.map((m) => (
                <div key={m.id} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-[13px] font-semibold text-gray-800">{m.meetingTopic}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {formatDate(m.meetingDate)} · {m.assignees.map((a) => a.user.name).join(", ")}
                    </p>
                  </div>
                  <StatusBadge status={m.priorityLevel} label={PRIORITY_LABELS[m.priorityLevel] ?? m.priorityLevel} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Status breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-[13px] font-semibold text-gray-800 mb-4">Proposals by Status</h3>
          <div className="space-y-2.5">
            {data.proposalsByStatus.map((s) => (
              <div key={s.currentStatus} className="flex items-center justify-between">
                <StatusBadge status={s.currentStatus} label={PROPOSAL_STATUS_LABELS[s.currentStatus] ?? s.currentStatus} />
                <span className="text-[13px] font-bold text-gray-700">{s._count}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-[13px] font-semibold text-gray-800 mb-4">Leads by Status</h3>
          <div className="space-y-2.5">
            {data.leadsByStatus.map((s) => (
              <div key={s.leadStatus} className="flex items-center justify-between">
                <StatusBadge status={s.leadStatus} label={s.leadStatus.replace(/_/g, " ")} />
                <span className="text-[13px] font-bold text-gray-700">{s._count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
