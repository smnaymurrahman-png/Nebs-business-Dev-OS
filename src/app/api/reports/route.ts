import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const reports = await prisma.report.findMany({
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
  return Response.json(reports);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const report = await prisma.report.create({
    data: {
      ...body,
      budget: parseFloat(body.budget),
      totalSpend: parseFloat(body.totalSpend || 0),
      totalClicks: parseInt(body.totalClicks || 0),
      totalLeads: parseInt(body.totalLeads || 0),
      totalMeetings: parseInt(body.totalMeetings || 0),
      adsStartingDate: new Date(body.adsStartingDate),
      createdById: session.user.id,
    },
  });
  return Response.json(report, { status: 201 });
}
