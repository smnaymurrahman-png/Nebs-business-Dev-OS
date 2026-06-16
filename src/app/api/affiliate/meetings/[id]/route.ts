import { prisma } from "@/lib/prisma";
import { getAffiliateSession } from "@/lib/affiliate-auth";
import { NextRequest } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getAffiliateSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const meeting = await prisma.affiliateMeeting.findFirst({
    where: { id, affiliateId: session.id },
    include: {
      lead: { select: { fullName: true, emailAddress: true } },
      attendees: {
        include: {
          meetingPerson: { select: { name: true, email: true } },
        },
      },
    },
  });

  if (!meeting) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(meeting);
}

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await getAffiliateSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const meeting = await prisma.affiliateMeeting.findFirst({
    where: { id, affiliateId: session.id },
    select: { id: true, requestStatus: true },
  });

  if (!meeting) return Response.json({ error: "Not found" }, { status: 404 });
  if (meeting.requestStatus !== "REQUESTED")
    return Response.json({ error: "Only pending requests can be edited" }, { status: 400 });

  const { topic, preferredAt, meetingPersonIds } = await req.json();

  // Replace attendees atomically
  const updated = await prisma.$transaction(async (tx) => {
    await tx.affiliateMeetingAttendee.deleteMany({ where: { meetingId: id } });

    return tx.affiliateMeeting.update({
      where: { id },
      data: {
        topic: topic?.trim() ?? undefined,
        preferredAt: preferredAt ? new Date(preferredAt) : undefined,
        attendees: meetingPersonIds?.length
          ? {
              create: (meetingPersonIds as string[]).map((mpId: string) => ({
                meetingPersonId: mpId,
              })),
            }
          : undefined,
      },
    });
  });

  return Response.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getAffiliateSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const meeting = await prisma.affiliateMeeting.findFirst({
    where: { id, affiliateId: session.id },
    select: { id: true, requestStatus: true },
  });

  if (!meeting) return Response.json({ error: "Not found" }, { status: 404 });
  if (meeting.requestStatus !== "REQUESTED")
    return Response.json({ error: "Only pending requests can be cancelled" }, { status: 400 });

  await prisma.affiliateMeeting.update({
    where: { id },
    data: { requestStatus: "CANCELLED" },
  });

  return new Response(null, { status: 204 });
}
