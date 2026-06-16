import { prisma } from "@/lib/prisma";
import { getAffiliateSession } from "@/lib/affiliate-auth";
import { NextRequest } from "next/server";

export async function GET() {
  const session = await getAffiliateSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const meetings = await prisma.affiliateMeeting.findMany({
    where: { affiliateId: session.id },
    include: {
      lead: { select: { fullName: true, emailAddress: true } },
      attendees: {
        include: {
          meetingPerson: { select: { name: true, email: true } },
          affiliate: { select: { fullName: true, email: true } },
        },
      },
    },
    orderBy: [{ requestStatus: "asc" }, { scheduledAt: "asc" }, { createdAt: "desc" }],
  });

  return Response.json(meetings);
}

export async function POST(req: NextRequest) {
  const session = await getAffiliateSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { leadId, topic, preferredAt, meetingPersonIds } = await req.json();

  if (!leadId || !topic?.trim())
    return Response.json({ error: "Lead and topic are required" }, { status: 400 });

  const lead = await prisma.lead.findFirst({
    where: { id: leadId, affiliateId: session.id },
    select: { id: true, leadStatus: true },
  });
  if (!lead) return Response.json({ error: "Lead not found" }, { status: 404 });

  const meeting = await prisma.affiliateMeeting.create({
    data: {
      leadId,
      affiliateId: session.id,
      topic: topic.trim(),
      preferredAt: preferredAt ? new Date(preferredAt) : undefined,
      requestStatus: "REQUESTED",
      attendees: meetingPersonIds?.length
        ? {
            create: (meetingPersonIds as string[]).map((mpId: string) => ({
              meetingPersonId: mpId,
            })),
          }
        : undefined,
    },
  });

  return Response.json(meeting, { status: 201 });
}
