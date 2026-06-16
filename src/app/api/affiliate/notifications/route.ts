import { prisma } from "@/lib/prisma";
import { getAffiliateSession } from "@/lib/affiliate-auth";

export async function GET() {
  const session = await getAffiliateSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const notifications = await prisma.notification.findMany({
    where: { recipientType: "AFFILIATE", recipientId: session.id },
    orderBy: { createdAt: "desc" },
    take: 30,
  });
  return Response.json(notifications);
}

export async function PATCH() {
  const session = await getAffiliateSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.notification.updateMany({
    where: { recipientType: "AFFILIATE", recipientId: session.id, readAt: null },
    data: { readAt: new Date() },
  });
  return Response.json({ success: true });
}
