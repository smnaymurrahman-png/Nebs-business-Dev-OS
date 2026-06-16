import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendMeetingInvite } from "@/lib/email";
import { NextRequest } from "next/server";

type Params = { params: Promise<{ id: string }> };

function requireAdmin(role?: string) {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

const INCLUDE = {
  lead: { select: { fullName: true, emailAddress: true, businessName: true, affiliateId: true, leadStatus: true, commission: { select: { id: true } } } },
  affiliate: { select: { fullName: true, email: true, affiliateCode: true } },
  attendees: {
    include: {
      meetingPerson: { select: { id: true, name: true, email: true } },
      affiliate: { select: { id: true, fullName: true, email: true } },
    },
  },
};

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!requireAdmin((session.user as { role?: string }).role))
    return Response.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const meeting = await prisma.affiliateMeeting.findUnique({ where: { id }, include: INCLUDE });
  if (!meeting) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(meeting);
}

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!requireAdmin((session.user as { role?: string }).role))
    return Response.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const { action } = body;

  const meeting = await prisma.affiliateMeeting.findUnique({ where: { id }, include: INCLUDE });
  if (!meeting) return Response.json({ error: "Not found" }, { status: 404 });

  // ── Schedule ──────────────────────────────────────────────────────────────────
  if (action === "schedule") {
    const { scheduledAt, locationType, meetingLink, meetingLocation, meetingPersonIds = [], includeAffiliate = true } = body;

    if (!scheduledAt || !locationType)
      return Response.json({ error: "scheduledAt and locationType are required" }, { status: 400 });
    if (locationType === "ONLINE" && !meetingLink)
      return Response.json({ error: "Meeting link required for online meetings" }, { status: 400 });
    if (locationType === "OFFLINE" && !meetingLocation)
      return Response.json({ error: "Location required for offline meetings" }, { status: 400 });

    const attendeeCreates: { meetingPersonId?: string; affiliateId?: string }[] = [
      ...(meetingPersonIds as string[]).map((mpId: string) => ({ meetingPersonId: mpId })),
      ...(includeAffiliate && meeting.affiliateId ? [{ affiliateId: meeting.affiliateId }] : []),
    ];

    const updated = await prisma.$transaction(async (tx) => {
      await tx.affiliateMeetingAttendee.deleteMany({ where: { meetingId: id } });
      return tx.affiliateMeeting.update({
        where: { id },
        data: {
          scheduledAt: new Date(scheduledAt),
          locationType,
          meetingLink: locationType === "ONLINE" ? meetingLink : null,
          meetingLocation: locationType === "OFFLINE" ? meetingLocation : null,
          requestStatus: "SCHEDULED",
          createdBy: session.user.id,
          attendees: attendeeCreates.length ? { create: attendeeCreates } : undefined,
        },
        include: INCLUDE,
      });
    });

    // Send email invites (best-effort, errors are non-blocking)
    try {
      const recipients: { name: string; email: string }[] = [];

      for (const att of updated.attendees) {
        if (att.meetingPerson) recipients.push({ name: att.meetingPerson.name, email: att.meetingPerson.email });
        if (att.affiliate) recipients.push({ name: att.affiliate.fullName, email: att.affiliate.email });
      }

      if (recipients.length > 0) {
        await sendMeetingInvite({
          topic: updated.topic,
          scheduledAt: updated.scheduledAt!,
          locationType: updated.locationType!,
          meetingLink: updated.meetingLink,
          meetingLocation: updated.meetingLocation,
          leadName: updated.lead.fullName,
          recipients,
        });
      }
    } catch (e) {
      console.error("[meetings] email send failed:", e);
    }

    return Response.json(updated);
  }

  // ── Set Result ────────────────────────────────────────────────────────────────
  if (action === "set_result") {
    const { result, dealValue } = body;

    const VALID_RESULTS = new Set(["NOT_INTERESTED", "QUOTATION_SENT", "ONBOARDED", "NEED_ANOTHER_MEETING"]);
    if (!result || !VALID_RESULTS.has(result))
      return Response.json({ error: "Invalid result" }, { status: 400 });

    const leadId = meeting.leadId;

    if (result === "ONBOARDED") {
      if (!dealValue || isNaN(parseFloat(dealValue)) || parseFloat(dealValue) <= 0)
        return Response.json({ error: "Deal value is required when marking Onboarded" }, { status: 400 });
      if (!meeting.lead.affiliateId)
        return Response.json({ error: "No affiliate on this lead" }, { status: 400 });
      if (meeting.lead.commission)
        return Response.json({ error: "Lead already has a commission record" }, { status: 400 });

      const dv = parseFloat(dealValue);
      const amount = parseFloat((dv * 0.15).toFixed(2));
      const now = new Date();
      const releaseDate = new Date(now.getTime() + 25 * 24 * 60 * 60 * 1000);

      await prisma.$transaction([
        prisma.affiliateMeeting.update({ where: { id }, data: { result } }),
        prisma.lead.update({
          where: { id: leadId },
          data: { leadStatus: "ONBOARDED", dealValue: dv, onboardedAt: now },
        }),
        prisma.leadActivity.create({
          data: {
            leadId,
            type: "STATUS_CHANGE",
            fromStatus: meeting.lead.leadStatus,
            toStatus: "ONBOARDED",
            createdBy: session.user.id,
          },
        }),
        prisma.commission.create({
          data: {
            leadId,
            affiliateId: meeting.lead.affiliateId,
            dealValue: dv,
            rate: 0.15,
            amount,
            status: "PENDING",
            onboardedAt: now,
            releaseDate,
          },
        }),
      ]);
    } else if (result === "QUOTATION_SENT") {
      await prisma.$transaction([
        prisma.affiliateMeeting.update({ where: { id }, data: { result } }),
        prisma.lead.update({ where: { id: leadId }, data: { leadStatus: "QUOTATION_SENT" } }),
        prisma.leadActivity.create({
          data: {
            leadId,
            type: "STATUS_CHANGE",
            fromStatus: meeting.lead.leadStatus,
            toStatus: "QUOTATION_SENT",
            createdBy: session.user.id,
          },
        }),
      ]);
    } else if (result === "NOT_INTERESTED") {
      await prisma.$transaction([
        prisma.affiliateMeeting.update({ where: { id }, data: { result } }),
        prisma.lead.update({ where: { id: leadId }, data: { leadStatus: "REJECTED" } }),
        prisma.leadActivity.create({
          data: {
            leadId,
            type: "STATUS_CHANGE",
            fromStatus: meeting.lead.leadStatus,
            toStatus: "REJECTED",
            createdBy: session.user.id,
          },
        }),
      ]);
    } else {
      // NEED_ANOTHER_MEETING — just set the result, lead stays in pipeline
      await prisma.affiliateMeeting.update({ where: { id }, data: { result } });
    }

    return Response.json({ success: true, result });
  }

  return Response.json({ error: "Unknown action" }, { status: 400 });
}
