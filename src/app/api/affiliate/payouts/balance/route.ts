import { prisma } from "@/lib/prisma";
import { getAffiliateSession } from "@/lib/affiliate-auth";

const MINIMUM_PAYOUT_USD = 15;

export async function GET() {
  const session = await getAffiliateSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();

  // Auto-release any commissions past their release date
  await prisma.commission.updateMany({
    where: {
      affiliateId: session.id,
      status: "PENDING",
      releaseDate: { lte: now },
    },
    data: { status: "AVAILABLE" },
  });

  const commissions = await prisma.commission.findMany({
    where: { affiliateId: session.id },
    include: { lead: { select: { fullName: true, businessName: true } } },
    orderBy: { createdAt: "desc" },
  });

  const pending = commissions
    .filter((c) => c.status === "PENDING")
    .reduce((s, c) => s + Number(c.amount), 0);

  const available = commissions
    .filter((c) => c.status === "AVAILABLE")
    .reduce((s, c) => s + Number(c.amount), 0);

  const paid = commissions
    .filter((c) => c.status === "PAID")
    .reduce((s, c) => s + Number(c.amount), 0);

  return Response.json({
    pending: parseFloat(pending.toFixed(2)),
    available: parseFloat(available.toFixed(2)),
    paid: parseFloat(paid.toFixed(2)),
    minimum: MINIMUM_PAYOUT_USD,
    commissions,
  });
}
