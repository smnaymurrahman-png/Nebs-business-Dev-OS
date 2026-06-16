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

  const persons = await prisma.meetingPerson.findMany({
    orderBy: { name: "asc" },
  });
  return Response.json(persons);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!requireAdmin((session.user as { role?: string }).role))
    return Response.json({ error: "Forbidden" }, { status: 403 });

  const { name, email } = await req.json();
  if (!name?.trim() || !email?.trim())
    return Response.json({ error: "Name and email are required" }, { status: 400 });

  const person = await prisma.meetingPerson.create({
    data: {
      id: crypto.randomUUID(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
    },
  });
  return Response.json(person, { status: 201 });
}
