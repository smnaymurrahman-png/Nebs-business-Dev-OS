import { getAffiliateSession } from "@/lib/affiliate-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getAffiliateSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const industries = await prisma.industry.findMany({
    where: { active: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return Response.json(industries);
}
