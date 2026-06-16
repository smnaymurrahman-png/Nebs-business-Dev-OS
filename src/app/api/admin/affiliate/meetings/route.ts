import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

function requireAdmin(role?: string) {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

const INCLUDE = {
  lead: { select: { fullName: true, emailAddress: true, businessName: true } },
  affiliate: { select: { fullName: true, email: true, affiliateCode: true } },
  attendees: {
    include: {
      meetingPerson: { select: { id: true, name: true, email: true } },
      affiliate: { select: { id: true, fullName: true, email: true } },
    },
  },
};

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!requireAdmin((session.user as { role?: string }).role))
    return Response.json({ error: "Forbidden" }, { status: 403 });

  const view = req.nextUrl.searchParams.get("view") ?? "queue";

  const where =
    view === "queue"
      ? { requestStatus: "REQUESTED" as const }
      : {};

  const meetings = await prisma.affiliateMeeting.findMany({
    where,
    include: INCLUDE,
    orderBy: { createdAt: "desc" },
  });

  return Response.json(meetings);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!requireAdmin((session.user as { role?: string }).role))
    return Response.json({ error: "Forbidden" }, { status: 403 });

  const {
    leadId,
    topic,
    scheduledAt,
    locationType,
    meetingLink,
    meetingLocation,
    meetingPersonIds = [],
    includeAffiliate = true,
  } = await req.json();

  if (!leadId || !topic?.trim() || !scheduledAt || !locationType)
    return Response.json({ error: "leadId, topic, scheduledAt, and locationType are required" }, { status: 400 });

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: { id: true, affiliateId: true },
  });
  if (!lead) return Response.json({ error: "Lead not found" }, { status: 404 });

  const attendeeCreates: { meetingPersonId?: string; affiliateId?: string }[] = [
    ...((meetingPersonIds as string[]).map((mpId) => ({ meetingPersonId: mpId }))),
    ...(includeAffiliate && lead.affiliateId ? [{ affiliateId: lead.affiliateId }] : []),
  ];

  const meeting = await prisma.affiliateMeeting.create({
    data: {
      leadId,
      affiliateId: lead.affiliateId ?? session.user.id,
      topic: topic.trim(),
      scheduledAt: new Date(scheduledAt),
      locationType,
      meetingLink: locationType === "ONLINE" ? meetingLink ?? null : null,
      meetingLocation: locationType === "OFFLINE" ? meetingLocation ?? null : null,
      requestStatus: "SCHEDULED",
      createdBy: session.user.id,
      attendees: attendeeCreates.length ? { create: attendeeCreates } : undefined,
    },
    include: INCLUDE,
  });

  return Response.json(meeting, { status: 201 });
}
