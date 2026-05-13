import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const clientId = request.nextUrl.searchParams.get("clientId");
  if (!clientId) return Response.json({ error: "clientId required" }, { status: 400 });
  const client = await prisma.client.findUnique({ where: { clientId } });
  if (!client) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(client);
}
