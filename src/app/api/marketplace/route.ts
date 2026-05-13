import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const profiles = await prisma.marketplaceProfile.findMany({
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
  return Response.json(profiles);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const profile = await prisma.marketplaceProfile.create({
    data: {
      ...body,
      amount: parseFloat(body.amount),
      totalInvestment: parseFloat(body.totalInvestment || 0),
      createdById: session.user.id,
    },
  });
  return Response.json(profile, { status: 201 });
}
