import { prisma } from "@/lib/prisma";
import { getAffiliateSession } from "@/lib/affiliate-auth";
import { NextRequest } from "next/server";

const MINIMUM_PAYOUT_USD = 15;

export async function GET() {
  const session = await getAffiliateSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const payouts = await prisma.payout.findMany({
    where: { affiliateId: session.id },
    include: { payoutMethod: { select: { type: true, details: true } } },
    orderBy: { createdAt: "desc" },
  });
  return Response.json(payouts);
}

export async function POST(req: NextRequest) {
  const session = await getAffiliateSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { payoutMethodId, amount } = await req.json();

  if (!payoutMethodId)
    return Response.json({ error: "Payout method is required" }, { status: 400 });

  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0)
    return Response.json({ error: "Invalid amount" }, { status: 400 });

  if (parsedAmount < MINIMUM_PAYOUT_USD)
    return Response.json(
      { error: `Minimum payout is $${MINIMUM_PAYOUT_USD} USD` },
      { status: 400 }
    );

  // Verify the payout method belongs to this affiliate
  const method = await prisma.payoutMethod.findFirst({
    where: { id: payoutMethodId, affiliateId: session.id },
  });
  if (!method) return Response.json({ error: "Payout method not found" }, { status: 404 });

  // Check available balance (re-release eligible commissions first)
  const now = new Date();
  await prisma.commission.updateMany({
    where: { affiliateId: session.id, status: "PENDING", releaseDate: { lte: now } },
    data: { status: "AVAILABLE" },
  });

  const available = await prisma.commission.aggregate({
    where: { affiliateId: session.id, status: "AVAILABLE" },
    _sum: { amount: true },
  });
  const availableBalance = Number(available._sum.amount ?? 0);

  if (parsedAmount > availableBalance)
    return Response.json(
      { error: `Amount exceeds available balance ($${availableBalance.toFixed(2)})` },
      { status: 400 }
    );

  const payout = await prisma.payout.create({
    data: {
      affiliateId: session.id,
      payoutMethodId,
      amount: parsedAmount,
      status: "REQUESTED",
    },
    include: { payoutMethod: { select: { type: true, details: true } } },
  });

  return Response.json(payout, { status: 201 });
}
