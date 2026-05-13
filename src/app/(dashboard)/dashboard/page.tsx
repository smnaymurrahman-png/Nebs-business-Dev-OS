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
    gradient: "from-violet-500 to-indigo-500",
    bg: "from-violet-50 to-indigo-50",
    shadow: "shadow-violet-100",
    text: "text-violet-700",
  },
  {
    key: "totalProposals" as const,
    label: "Proposals",
    icon: FileText,
    gradient: "from-sky-500 to-blue-500",
    bg: "from-sky-50 to-blue-50",
    shadow: "shadow-sky-100",
    text: "text-sky-700",
  },
  {
    key: "totalLeads" as const,
    label: "Total Leads",
    icon: TrendingUp,
    gradient: "from-emerald-500 to-teal-500",
    bg: "from-emerald-50 to-teal-50",
    shadow: "shadow-emerald-100",
    text: "text-emerald-700",
  },
  {
    key: "totalMeetings" as const,
    label: "Meetings",
    icon: CalendarDays,
    gradient: "from-orange-400 to-rose-500",
    bg: "from-orange-50 to-rose-50",
    shadow: "shadow-orange-100",
    text: "text-orange-700",
  },
  {
    key: "totalRevenue" as const,
    label: "Revenue",
    icon: DollarSign,
    gradient: "from-amber-400 to-orange-500",
    bg: "from-amber-50 to-orange-50",
    shadow: "shadow-amber-100",
    text: "text-amber-700",
    currency: true,
  },
];

function StatCard({
  label,
  value,
  icon: Icon,
  gradient,
  bg,
  shadow,
  text,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  gradient: string;
  bg: string;
  shadow: string;
  text: string;
}) {
  return (
    <div className={`bg-gradient-to-br ${bg} rounded-2xl p-5 border border-white shadow-md ${shadow} flex items-center gap-4`}>
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg flex-shrink-0`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
        <p className={`text-2xl font-bold ${text} leading-tight mt-0.5`}>{value}</p>
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
        <div className="w-8 h-8 border-4 border-violet-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        {statCards.map((card) => (
          <StatCard
            key={card.key}
            label={card.label}
            value={card.currency ? formatCurrency(data[card.key] as number) : data[card.key]}
            icon={card.icon}
            gradient={card.gradient}
            bg={card.bg}
            shadow={card.shadow}
            text={card.text}
          />
        ))}
      </div>

      {/* Recent Proposals + Upcoming Meetings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Recent Proposals</h3>
          {data.recentProposals.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No proposals yet</p>
          ) : (
            <div className="space-y-3">
              {data.recentProposals.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{p.projectName}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{p.client.name} · {formatDate(p.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-3 shrink-0">
                    <span className="text-sm font-bold text-gray-700">{formatCurrency(p.amount)}</span>
                    <StatusBadge status={p.currentStatus} label={PROPOSAL_STATUS_LABELS[p.currentStatus] ?? p.currentStatus} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Upcoming Meetings</h3>
          {data.upcomingMeetings.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No upcoming meetings</p>
          ) : (
            <div className="space-y-3">
              {data.upcomingMeetings.map((m) => (
                <div key={m.id} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{m.meetingTopic}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Proposals by Status</h3>
          <div className="space-y-2.5">
            {data.proposalsByStatus.map((s) => (
              <div key={s.currentStatus} className="flex items-center justify-between">
                <StatusBadge status={s.currentStatus} label={PROPOSAL_STATUS_LABELS[s.currentStatus] ?? s.currentStatus} />
                <span className="text-sm font-bold text-gray-700">{s._count}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Leads by Status</h3>
          <div className="space-y-2.5">
            {data.leadsByStatus.map((s) => (
              <div key={s.leadStatus} className="flex items-center justify-between">
                <StatusBadge status={s.leadStatus} label={s.leadStatus.replace(/_/g, " ")} />
                <span className="text-sm font-bold text-gray-700">{s._count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
