import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await request.json();
  if (body.budget) body.budget = parseFloat(body.budget);
  if (body.totalSpend) body.totalSpend = parseFloat(body.totalSpend);
  if (body.totalClicks) body.totalClicks = parseInt(body.totalClicks);
  if (body.totalLeads) body.totalLeads = parseInt(body.totalLeads);
  if (body.totalMeetings) body.totalMeetings = parseInt(body.totalMeetings);
  if (body.adsStartingDate) body.adsStartingDate = new Date(body.adsStartingDate);
  const report = await prisma.report.update({ where: { id }, data: body });
  return Response.json(report);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await prisma.report.delete({ where: { id } });
  return Response.json({ success: true });
}
