import { prisma } from "@/lib/prisma";
import { getAffiliateSession } from "@/lib/affiliate-auth";
import { NextRequest } from "next/server";

export async function GET() {
  const session = await getAffiliateSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const methods = await prisma.payoutMethod.findMany({
    where: { affiliateId: session.id },
    orderBy: { createdAt: "asc" },
  });
  return Response.json(methods);
}

export async function POST(req: NextRequest) {
  const session = await getAffiliateSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { type, details } = await req.json();

  const VALID_TYPES = new Set(["BKASH", "NAGAD", "BANK", "INTERNATIONAL"]);
  if (!type || !VALID_TYPES.has(type))
    return Response.json({ error: "Invalid payout method type" }, { status: 400 });

  if (!details || typeof details !== "object")
    return Response.json({ error: "Details are required" }, { status: 400 });

  const method = await prisma.payoutMethod.create({
    data: { affiliateId: session.id, type, details },
  });
  return Response.json(method, { status: 201 });
}
