import { getAffiliateSession } from "@/lib/affiliate-auth";
import { prisma } from "@/lib/prisma";
import { CopyReferralLink } from "@/components/affiliate/CopyReferralLink";

export default async function AffiliateDashboardPage() {
  const session = await getAffiliateSession();
  if (!session) return null;

  const [totalLeads, pendingLeads, acceptedLeads, onboardedLeads] = await Promise.all([
    prisma.lead.count({ where: { affiliateId: session.id } }),
    prisma.lead.count({ where: { affiliateId: session.id, leadStatus: "SUBMITTED" } }),
    prisma.lead.count({ where: { affiliateId: session.id, leadStatus: "ACCEPTED" } }),
    prisma.lead.count({ where: { affiliateId: session.id, leadStatus: "ONBOARDED" } }),
  ]);

  const stats = [
    { label: "Total Leads",    value: totalLeads,    color: "bg-violet-50 text-violet-700 border-violet-100" },
    { label: "Pending Review", value: pendingLeads,  color: "bg-amber-50 text-amber-700 border-amber-100" },
    { label: "Accepted",       value: acceptedLeads, color: "bg-blue-50 text-blue-700 border-blue-100" },
    { label: "Onboarded",      value: onboardedLeads, color: "bg-emerald-50 text-emerald-700 border-emerald-100" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">
          Welcome back, {session.name.split(" ")[0]}
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">Here&apos;s a summary of your affiliate activity</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div key={s.label} className={`rounded-xl border p-4 ${s.color}`}>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs font-medium mt-0.5 opacity-80">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <p className="text-sm font-semibold text-gray-700 mb-1">Your referral link</p>
        <p className="text-xs text-gray-400 mb-3">
          Share this link — leads submitted through it are automatically attributed to you.
        </p>
        <CopyReferralLink code={session.code} />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <p className="text-sm font-semibold text-gray-700 mb-4">Commission balance</p>
        <div className="grid grid-cols-3 gap-4 text-center">
          {[
            { label: "Pending (hold)", color: "text-amber-600" },
            { label: "Available",      color: "text-emerald-600" },
            { label: "Paid",           color: "text-gray-500" },
          ].map((c) => (
            <div key={c.label}>
              <p className={`text-lg font-bold ${c.color}`}>$0.00</p>
              <p className="text-[11px] text-gray-400 mt-0.5">{c.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
