import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

type Params = { params: Promise<{ id: string }> };

function requireAdmin(role?: string) {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!requireAdmin((session.user as { role?: string }).role))
    return Response.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const entries = await prisma.leadActivity.findMany({
    where: { leadId: id },
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return Response.json(entries);
}

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!requireAdmin((session.user as { role?: string }).role))
    return Response.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { note } = await req.json();

  if (!note?.trim()) return Response.json({ error: "Note is required" }, { status: 400 });

  const lead = await prisma.lead.findUnique({ where: { id }, select: { id: true } });
  if (!lead) return Response.json({ error: "Lead not found" }, { status: 404 });

  const entry = await prisma.leadActivity.create({
    data: {
      leadId: id,
      type: "NOTE",
      note: note.trim(),
      createdBy: session.user.id,
    },
    include: { user: { select: { name: true } } },
  });

  return Response.json(entry, { status: 201 });
}
