import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAffiliateSession } from "@/lib/affiliate-auth";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAffiliateSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const lead = await prisma.lead.findUnique({
    where: { id },
    select: { affiliateId: true, leadStatus: true },
  });

  if (!lead) return Response.json({ error: "Not found" }, { status: 404 });
  if (lead.affiliateId !== session.id)
    return Response.json({ error: "Forbidden" }, { status: 403 });
  if (lead.leadStatus !== "SUBMITTED")
    return Response.json(
      { error: "Only Submitted leads can be deleted" },
      { status: 400 }
    );

  await prisma.lead.delete({ where: { id } });
  return Response.json({ ok: true });
}
