import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

function requireAdmin(role?: string) {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

export async function GET() {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!requireAdmin((session.user as { role?: string }).role))
    return Response.json({ error: "Forbidden" }, { status: 403 });

  const affiliates = await prisma.affiliate.findMany({
    include: {
      approver: { select: { name: true } },
      _count: { select: { leads: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Attach aggregated stats
  const stats = await Promise.all(
    affiliates.map(async (a) => {
      const [accepted, onboarded, commTotal, commPaid] = await Promise.all([
        prisma.lead.count({ where: { affiliateId: a.id, leadStatus: { in: ["ACCEPTED", "QUOTATION_SENT", "MEETING_PENDING", "MEETING_DONE", "FOLLOW_UP", "NOT_RESPONDING"] } } }),
        prisma.lead.count({ where: { affiliateId: a.id, leadStatus: "ONBOARDED" } }),
        prisma.commission.aggregate({ where: { affiliateId: a.id }, _sum: { amount: true } }),
        prisma.commission.aggregate({ where: { affiliateId: a.id, status: "PAID" }, _sum: { amount: true } }),
      ]);
      return {
        ...a,
        stats: {
          submitted: a._count.leads,
          accepted,
          onboarded,
          commissionEarned: Number(commTotal._sum.amount ?? 0),
          commissionPaid: Number(commPaid._sum.amount ?? 0),
        },
      };
    })
  );

  return Response.json(stats);
}
