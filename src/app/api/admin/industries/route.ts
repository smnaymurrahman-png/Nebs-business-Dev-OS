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

  const rows = await prisma.industry.findMany({ orderBy: { name: "asc" } });
  return Response.json(rows);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!requireAdmin((session.user as { role?: string }).role))
    return Response.json({ error: "Forbidden" }, { status: 403 });

  const { name } = await req.json();
  if (!name?.trim()) return Response.json({ error: "Name required" }, { status: 400 });

  const row = await prisma.industry.create({ data: { name: name.trim() } });
  return Response.json(row, { status: 201 });
}
