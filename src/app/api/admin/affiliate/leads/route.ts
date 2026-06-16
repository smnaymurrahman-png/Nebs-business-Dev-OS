import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

function requireAdmin(role?: string) {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!requireAdmin((session.user as { role?: string }).role))
    return Response.json({ error: "Forbidden" }, { status: 403 });

  const view = req.nextUrl.searchParams.get("view") ?? "incoming";

  const where =
    view === "incoming"
      ? { affiliateId: { not: null }, leadStatus: "SUBMITTED" as const }
      : { affiliateId: { not: null }, leadStatus: { not: "SUBMITTED" as const } };

  const leads = await prisma.lead.findMany({
    where,
    include: {
      industry:       { select: { name: true } },
      serviceTypeOpt: { select: { name: true } },
      affiliate:      { select: { fullName: true, email: true, affiliateCode: true } },
      commission:     { select: { amount: true, status: true, releaseDate: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return Response.json(leads);
}
