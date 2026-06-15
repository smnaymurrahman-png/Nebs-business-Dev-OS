import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role: string }).role;
  const isAdmin = role === "SUPER_ADMIN" || role === "ADMIN";

  if (isAdmin) {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, designation: true, role: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });
    return Response.json(users);
  }

  // All authenticated users can see a minimal list for BDM dropdowns
  const users = await prisma.user.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  return Response.json(users);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role: string }).role;
  if (role !== "SUPER_ADMIN" && role !== "ADMIN") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await request.json();
  const { name, email, password, designation, role: newRole } = body;
  if (!name || !email || !password) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }
  if (role === "ADMIN" && newRole === "SUPER_ADMIN") {
    return Response.json({ error: "Admins cannot create Super Admins" }, { status: 403 });
  }
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return Response.json({ error: "Email already exists" }, { status: 409 });
  }
  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashed,
      designation,
      role: newRole || "USER",
      createdById: session.user.id,
    },
    select: { id: true, name: true, email: true, designation: true, role: true },
  });
  return Response.json(user, { status: 201 });
}
