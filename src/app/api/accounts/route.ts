import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;
  const role = (session.user as { role: string }).role;
  const accounts = await prisma.account.findMany({
    include: { user: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });
  const result = accounts.map((acc: typeof accounts[number]) => ({
    ...acc,
    password:
      role === "SUPER_ADMIN" || role === "ADMIN" || acc.createdById === userId
        ? acc.password
        : "••••••••",
  }));
  return Response.json(result);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const account = await prisma.account.create({
    data: {
      ...body,
      amount: parseFloat(body.amount),
      createdById: session.user.id,
    },
  });
  return Response.json(account, { status: 201 });
}
