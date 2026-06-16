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
  const { action, rejectReason } = await req.json();

  const payout = await prisma.payout.findUnique({
    where: { id },
    select: { id: true, status: true, affiliateId: true, amount: true },
  });
  if (!payout) return Response.json({ error: "Not found" }, { status: 404 });

  // ── Approve ──────────────────────────────────────────────────────────────────
  if (action === "approve") {
    if (payout.status !== "REQUESTED")
      return Response.json({ error: "Only REQUESTED payouts can be approved" }, { status: 400 });

    const updated = await prisma.payout.update({
      where: { id },
      data: { status: "APPROVED", processedBy: session.user.id },
    });

    prisma.notification.create({
      data: {
        recipientType: "AFFILIATE",
        recipientId: payout.affiliateId,
        type: "PAYOUT_APPROVED",
        payload: { payoutId: id, amount: Number(payout.amount) },
      },
    }).catch(() => {});

    return Response.json(updated);
  }

  // ── Mark Paid ────────────────────────────────────────────────────────────────
  if (action === "mark_paid") {
    if (payout.status !== "APPROVED")
      return Response.json({ error: "Only APPROVED payouts can be marked paid" }, { status: 400 });

    const now = new Date();
    const payoutAmount = Number(payout.amount);

    await prisma.$transaction(async (tx) => {
      // 1. Mark payout as PAID
      await tx.payout.update({
        where: { id },
        data: { status: "PAID", paidAt: now, processedBy: session.user.id },
      });

      // 2. Release any newly eligible commissions first
      await tx.commission.updateMany({
        where: { affiliateId: payout.affiliateId, status: "PENDING", releaseDate: { lte: now } },
        data: { status: "AVAILABLE" },
      });

      // 3. Mark AVAILABLE commissions as PAID (FIFO) to cover the payout amount
      const available = await tx.commission.findMany({
        where: { affiliateId: payout.affiliateId, status: "AVAILABLE" },
        orderBy: { releaseDate: "asc" },
      });

      let remaining = payoutAmount;
      const toPay: string[] = [];
      for (const c of available) {
        if (remaining <= 0) break;
        toPay.push(c.id);
        remaining -= Number(c.amount);
      }

      if (toPay.length > 0) {
        await tx.commission.updateMany({
          where: { id: { in: toPay } },
          data: { status: "PAID", payoutId: id },
        });
      }
    });

    prisma.notification.create({
      data: {
        recipientType: "AFFILIATE",
        recipientId: payout.affiliateId,
        type: "PAYOUT_PAID",
        payload: { payoutId: id, amount: payoutAmount },
      },
    }).catch(() => {});

    return Response.json({ success: true });
  }

  // ── Reject ───────────────────────────────────────────────────────────────────
  if (action === "reject") {
    if (!["REQUESTED", "APPROVED"].includes(payout.status))
      return Response.json({ error: "Cannot reject this payout" }, { status: 400 });

    const updated = await prisma.payout.update({
      where: { id },
      data: {
        status: "REJECTED",
        rejectReason: rejectReason?.trim() ?? null,
        processedBy: session.user.id,
      },
    });
    return Response.json(updated);
  }

  return Response.json({ error: "Unknown action" }, { status: 400 });
}
