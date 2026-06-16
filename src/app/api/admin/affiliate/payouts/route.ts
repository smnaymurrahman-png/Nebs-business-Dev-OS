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

  const view = req.nextUrl.searchParams.get("view") ?? "queue";

  const where =
    view === "queue"
      ? { status: { in: ["REQUESTED", "APPROVED"] as ("REQUESTED" | "APPROVED")[] } }
      : {};

  const payouts = await prisma.payout.findMany({
    where,
    include: {
      affiliate: { select: { fullName: true, email: true, affiliateCode: true } },
      payoutMethod: { select: { type: true, details: true } },
      processor: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return Response.json(payouts);
}
