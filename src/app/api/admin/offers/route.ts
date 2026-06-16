import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

function requireAdmin(role?: string) {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

export async function GET() {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!requireAdmin((session.user as { role?: string }).role))
    return Response.json({ error: "Forbidden" }, { status: 403 });

  const offers = await prisma.offer.findMany({
    include: { author: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
  return Response.json(offers);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!requireAdmin((session.user as { role?: string }).role))
    return Response.json({ error: "Forbidden" }, { status: 403 });

  const { serviceName, details, price, duration } = await req.json();

  if (!serviceName?.trim() || !details?.trim() || !price || !duration?.trim())
    return Response.json({ error: "serviceName, details, price, and duration are required" }, { status: 400 });

  const parsedPrice = parseFloat(price);
  if (isNaN(parsedPrice) || parsedPrice < 0)
    return Response.json({ error: "Invalid price" }, { status: 400 });

  const offer = await prisma.offer.create({
    data: {
      serviceName: serviceName.trim(),
      details: details.trim(),
      price: parsedPrice,
      duration: duration.trim(),
      authorId: session.user.id,
    },
    include: { author: { select: { name: true } } },
  });

  // Fan-out in-app notification to all ACTIVE affiliates (non-blocking)
  prisma.affiliate.findMany({ where: { status: "ACTIVE" }, select: { id: true } })
    .then((affiliates) => {
      if (affiliates.length === 0) return;
      return prisma.notification.createMany({
        data: affiliates.map((a) => ({
          recipientType: "AFFILIATE" as const,
          recipientId: a.id,
          type: "NEW_OFFER",
          payload: {
            offerId: offer.id,
            serviceName: offer.serviceName,
            price: parsedPrice,
          },
        })),
      });
    })
    .catch((e) => console.error("[offers] notification fan-out failed:", e));

  return Response.json(offer, { status: 201 });
}
