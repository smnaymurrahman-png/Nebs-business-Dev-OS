import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

type Params = { params: Promise<{ id: string }> };

function requireAdmin(role?: string) {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!requireAdmin((session.user as { role?: string }).role))
    return Response.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { serviceName, details, price, duration } = await req.json();

  const parsedPrice = price !== undefined ? parseFloat(price) : undefined;
  if (parsedPrice !== undefined && (isNaN(parsedPrice) || parsedPrice < 0))
    return Response.json({ error: "Invalid price" }, { status: 400 });

  const updated = await prisma.offer.update({
    where: { id },
    data: {
      serviceName: serviceName?.trim() ?? undefined,
      details: details?.trim() ?? undefined,
      price: parsedPrice,
      duration: duration?.trim() ?? undefined,
    },
    include: { author: { select: { name: true } } },
  });

  return Response.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!requireAdmin((session.user as { role?: string }).role))
    return Response.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  await prisma.offer.delete({ where: { id } });
  return new Response(null, { status: 204 });
}
