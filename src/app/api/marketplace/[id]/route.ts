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
  if (body.amount) body.amount = parseFloat(body.amount);
  if (body.totalInvestment) body.totalInvestment = parseFloat(body.totalInvestment);
  const profile = await prisma.marketplaceProfile.update({ where: { id }, data: body });
  return Response.json(profile);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await prisma.marketplaceProfile.delete({ where: { id } });
  return Response.json({ success: true });
}
