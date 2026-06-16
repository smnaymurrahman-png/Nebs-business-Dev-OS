import { getAffiliateSession } from "@/lib/affiliate-auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { cn, formatDate } from "@/lib/utils";

const PROJECT_STATUS_LABELS: Record<string, string> = {
  ONGOING: "Project Ongoing",
  COMPLETED: "Project Completed",
  CANCELLED: "Project Cancelled",
};

const PROJECT_STATUS_COLORS: Record<string, string> = {
  ONGOING:   "bg-blue-50 text-blue-700",
  COMPLETED: "bg-emerald-50 text-emerald-700",
  CANCELLED: "bg-gray-100 text-gray-500",
};

export default async function AffiliateOnboardedPage() {
  const session = await getAffiliateSession();
  if (!session) redirect("/affiliate/login");

  const leads = await prisma.lead.findMany({
    where: { affiliateId: session.id, leadStatus: "ONBOARDED" },
    include: {
      industry: { select: { name: true } },
      commission: { select: { amount: true, status: true, releaseDate: true } },
    },
    orderBy: { onboardedAt: "desc" },
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Onboarded Leads</h1>
        <p className="text-sm text-gray-500 mt-0.5">Leads that have converted — your commissions live here</p>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Onboarded", value: leads.length },
          { label: "Active Projects", value: leads.filter((l) => l.projectStatus === "ONGOING").length },
          { label: "Completed", value: leads.filter((l) => l.projectStatus === "COMPLETED").length },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-400 font-medium mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {leads.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 flex flex-col items-center py-16">
          <p className="text-sm font-medium text-gray-500">No onboarded leads yet</p>
          <p className="text-xs text-gray-400 mt-1">Leads you submit will appear here when they convert</p>
        </div>
      ) : (
        <div className="space-y-3">
          {leads.map((lead) => (
            <div key={lead.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-900">{lead.fullName}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{lead.businessName}</p>
                  {lead.industry && <p className="text-xs text-gray-400 mt-1">{lead.industry.name}</p>}
                  {lead.onboardedAt && (
                    <p className="text-xs text-gray-400 mt-1">Onboarded {formatDate(lead.onboardedAt.toISOString())}</p>
                  )}
                </div>
                <div className="shrink-0 text-right space-y-1.5">
                  {lead.projectStatus ? (
                    <span className={cn("inline-block px-2.5 py-1 rounded-lg text-xs font-semibold", PROJECT_STATUS_COLORS[lead.projectStatus])}>
                      {PROJECT_STATUS_LABELS[lead.projectStatus]}
                    </span>
                  ) : (
                    <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-500">
                      Project status pending
                    </span>
                  )}
                  {lead.commission && (
                    <div className="text-right">
                      <p className="text-xs font-bold text-emerald-700">${Number(lead.commission.amount).toFixed(2)}</p>
                      <p className="text-[10px] text-gray-400">
                        {lead.commission.status === "PENDING"
                          ? `Releases ${formatDate(lead.commission.releaseDate.toISOString())}`
                          : lead.commission.status === "AVAILABLE"
                          ? "Available to withdraw"
                          : "Paid out"}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
