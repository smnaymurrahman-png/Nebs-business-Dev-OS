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
  const { currentStatus, followUp, remark, ...rest } = body;
  const data: Record<string, unknown> = { ...rest };
  if (currentStatus !== undefined) data.currentStatus = currentStatus;
  if (followUp !== undefined) data.followUp = parseInt(followUp);
  if (remark !== undefined) data.remark = remark;
  if (data.amount) data.amount = parseFloat(data.amount as string);
  if (data.costing) data.costing = parseFloat(data.costing as string);
  if (data.connectIn) data.connectIn = parseInt(data.connectIn as string);
  const proposal = await prisma.proposal.update({
    where: { id },
    data,
    include: { client: true },
  });
  return Response.json(proposal);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await prisma.proposal.delete({ where: { id } });
  return Response.json({ success: true });
}
