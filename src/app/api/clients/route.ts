import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateClientId } from "@/lib/utils";
import { NextRequest } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const clients = await prisma.client.findMany({
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
  return Response.json(clients);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const { name, email, phone, country, businessName, platform } = body;
  if (!name || !email || !phone || !country || !businessName || !platform) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }
  const clientId = generateClientId();
  const client = await prisma.client.create({
    data: {
      clientId,
      name,
      email,
      phone,
      country,
      businessName,
      platform,
      createdById: session.user.id,
    },
  });
  return Response.json(client, { status: 201 });
}
