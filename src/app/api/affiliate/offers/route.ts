import { prisma } from "@/lib/prisma";
import { getAffiliateSession } from "@/lib/affiliate-auth";

export async function GET() {
  const session = await getAffiliateSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const offers = await prisma.offer.findMany({
    include: { author: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
  return Response.json(offers);
}
