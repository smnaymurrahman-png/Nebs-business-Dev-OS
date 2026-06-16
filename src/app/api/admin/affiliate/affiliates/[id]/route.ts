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
  const { action } = await req.json();

  const VALID = new Set(["approve", "suspend", "ban", "reactivate"]);
  if (!VALID.has(action)) return Response.json({ error: "Invalid action" }, { status: 400 });

  const affiliate = await prisma.affiliate.findUnique({ where: { id }, select: { id: true, status: true } });
  if (!affiliate) return Response.json({ error: "Not found" }, { status: 404 });

  const STATUS_MAP: Record<string, string> = {
    approve: "ACTIVE",
    suspend: "SUSPENDED",
    ban: "BANNED",
    reactivate: "ACTIVE",
  };

  const updated = await prisma.affiliate.update({
    where: { id },
    data: {
      status: STATUS_MAP[action] as "ACTIVE" | "SUSPENDED" | "BANNED",
      approvedBy: action === "approve" ? session.user.id : undefined,
      approvedAt: action === "approve" ? new Date() : undefined,
    },
  });

  return Response.json(updated);
}
