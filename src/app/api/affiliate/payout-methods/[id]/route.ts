import { prisma } from "@/lib/prisma";
import { getAffiliateSession } from "@/lib/affiliate-auth";
import { NextRequest } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await getAffiliateSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { details } = await req.json();

  const method = await prisma.payoutMethod.findFirst({
    where: { id, affiliateId: session.id },
  });
  if (!method) return Response.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.payoutMethod.update({
    where: { id },
    data: { details },
  });
  return Response.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getAffiliateSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const method = await prisma.payoutMethod.findFirst({
    where: { id, affiliateId: session.id },
  });
  if (!method) return Response.json({ error: "Not found" }, { status: 404 });

  // Block deletion if there are active (non-rejected) payouts using this method
  const activePayout = await prisma.payout.findFirst({
    where: { payoutMethodId: id, status: { notIn: ["REJECTED"] } },
    select: { id: true },
  });
  if (activePayout)
    return Response.json(
      { error: "Cannot delete a method that has an active payout request" },
      { status: 400 }
    );

  await prisma.payoutMethod.delete({ where: { id } });
  return new Response(null, { status: 204 });
}
