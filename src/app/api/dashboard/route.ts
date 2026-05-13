import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const [
    totalClients,
    totalProposals,
    totalLeads,
    totalMeetings,
    proposalsByStatus,
    leadsByStatus,
    recentProposals,
    upcomingMeetings,
  ] = await Promise.all([
    prisma.client.count(),
    prisma.proposal.count(),
    prisma.lead.count(),
    prisma.meeting.count(),
    prisma.proposal.groupBy({ by: ["currentStatus"], _count: true }),
    prisma.lead.groupBy({ by: ["leadStatus"], _count: true }),
    prisma.proposal.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { client: true },
    }),
    prisma.meeting.findMany({
      take: 5,
      where: { meetingDate: { gte: new Date() } },
      orderBy: { meetingDate: "asc" },
      include: { assignees: { include: { user: { select: { name: true } } } } },
    }),
  ]);

  const totalRevenue = await prisma.proposal.aggregate({
    where: { currentStatus: "ORDER_COMPLETED" },
    _sum: { amount: true },
  });

  return Response.json({
    totalClients,
    totalProposals,
    totalLeads,
    totalMeetings,
    totalRevenue: totalRevenue._sum.amount ?? 0,
    proposalsByStatus,
    leadsByStatus,
    recentProposals,
    upcomingMeetings,
  });
}
