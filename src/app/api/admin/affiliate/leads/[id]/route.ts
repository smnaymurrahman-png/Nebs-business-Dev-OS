import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

type Params = { params: Promise<{ id: string }> };

function requireAdmin(role?: string) {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

const PIPELINE_STATUSES = new Set([
  "ACCEPTED", "QUOTATION_SENT", "NOT_RESPONDING", "MEETING_PENDING",
  "MEETING_DONE", "FOLLOW_UP", "ONBOARDED", "REJECTED",
]);

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!requireAdmin((session.user as { role?: string }).role))
    return Response.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const lead = await prisma.lead.findUnique({
    where: { id },
    include: {
      industry:       { select: { name: true } },
      serviceTypeOpt: { select: { name: true } },
      affiliate:      { select: { fullName: true, email: true, affiliateCode: true } },
      commission:     true,
    },
  });

  if (!lead) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(lead);
}

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as { role?: string }).role;
  if (!requireAdmin(role))
    return Response.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const { action, newStatus, projectStatus, dealValue } = body;

  const lead = await prisma.lead.findUnique({
    where: { id },
    select: { id: true, leadStatus: true, projectStatus: true, affiliateId: true, commission: { select: { id: true } } },
  });
  if (!lead) return Response.json({ error: "Not found" }, { status: 404 });

  // ── Accept ──────────────────────────────────────────────────────────────────
  if (action === "accept") {
    if (lead.leadStatus !== "SUBMITTED")
      return Response.json({ error: "Only SUBMITTED leads can be accepted" }, { status: 400 });

    const [updated] = await prisma.$transaction([
      prisma.lead.update({
        where: { id },
        data: {
          leadStatus: "ACCEPTED",
          acceptedBy: session.user.id,
        },
      }),
      prisma.leadActivity.create({
        data: {
          leadId: id,
          type: "STATUS_CHANGE",
          fromStatus: "SUBMITTED",
          toStatus: "ACCEPTED",
          createdBy: session.user.id,
        },
      }),
    ]);
    return Response.json(updated);
  }

  // ── Reject ───────────────────────────────────────────────────────────────────
  if (action === "reject") {
    if (lead.leadStatus !== "SUBMITTED")
      return Response.json({ error: "Only SUBMITTED leads can be rejected here" }, { status: 400 });

    const [updated] = await prisma.$transaction([
      prisma.lead.update({ where: { id }, data: { leadStatus: "REJECTED" } }),
      prisma.leadActivity.create({
        data: {
          leadId: id,
          type: "STATUS_CHANGE",
          fromStatus: "SUBMITTED",
          toStatus: "REJECTED",
          createdBy: session.user.id,
        },
      }),
    ]);
    return Response.json(updated);
  }

  // ── Set Status ───────────────────────────────────────────────────────────────
  if (action === "set_status") {
    if (!newStatus || !PIPELINE_STATUSES.has(newStatus))
      return Response.json({ error: "Invalid status" }, { status: 400 });

    // ONBOARDED requires a deal_value and an affiliate to commission
    if (newStatus === "ONBOARDED") {
      if (!dealValue || isNaN(parseFloat(dealValue)) || parseFloat(dealValue) <= 0)
        return Response.json({ error: "Deal value is required when onboarding" }, { status: 400 });
      if (!lead.affiliateId)
        return Response.json({ error: "No affiliate on this lead — cannot create commission" }, { status: 400 });
      if (lead.commission)
        return Response.json({ error: "This lead already has a commission record" }, { status: 400 });

      const dv = parseFloat(dealValue);
      const amount = parseFloat((dv * 0.15).toFixed(2));
      const now = new Date();
      const releaseDate = new Date(now.getTime() + 25 * 24 * 60 * 60 * 1000);

      const [updated] = await prisma.$transaction([
        prisma.lead.update({
          where: { id },
          data: { leadStatus: "ONBOARDED", dealValue: dv, onboardedAt: now },
        }),
        prisma.leadActivity.create({
          data: {
            leadId: id,
            type: "STATUS_CHANGE",
            fromStatus: lead.leadStatus,
            toStatus: "ONBOARDED",
            createdBy: session.user.id,
          },
        }),
        prisma.commission.create({
          data: {
            leadId: id,
            affiliateId: lead.affiliateId,
            dealValue: dv,
            rate: 0.15,
            amount,
            status: "PENDING",
            onboardedAt: now,
            releaseDate,
          },
        }),
      ]);
      return Response.json(updated);
    }

    const [updated] = await prisma.$transaction([
      prisma.lead.update({ where: { id }, data: { leadStatus: newStatus } }),
      prisma.leadActivity.create({
        data: {
          leadId: id,
          type: "STATUS_CHANGE",
          fromStatus: lead.leadStatus,
          toStatus: newStatus,
          createdBy: session.user.id,
        },
      }),
    ]);
    return Response.json(updated);
  }

  // ── Set Project Status ────────────────────────────────────────────────────────
  if (action === "set_project_status") {
    const validProjectStatuses = new Set(["ONGOING", "COMPLETED", "CANCELLED"]);
    if (!projectStatus || !validProjectStatuses.has(projectStatus))
      return Response.json({ error: "Invalid project status" }, { status: 400 });

    const [updated] = await prisma.$transaction([
      prisma.lead.update({ where: { id }, data: { projectStatus } }),
      prisma.leadActivity.create({
        data: {
          leadId: id,
          type: "PROJECT_STATUS_CHANGE",
          fromStatus: lead.projectStatus ?? undefined,
          toStatus: projectStatus,
          createdBy: session.user.id,
        },
      }),
    ]);
    return Response.json(updated);
  }

  return Response.json({ error: "Unknown action" }, { status: 400 });
}
