import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const proposals = await prisma.proposal.findMany({
    include: {
      client: true,
      user: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return Response.json(proposals);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const {
    clientId,
    platform,
    projectName,
    projectDetails,
    amount,
    proposal,
    messageToClient,
    connectIn,
    costing,
    serviceType,
  } = body;
  const clientRecord = await prisma.client.findUnique({ where: { clientId } });
  if (!clientRecord) {
    return Response.json({ error: "Client not found" }, { status: 404 });
  }
  const newProposal = await prisma.proposal.create({
    data: {
      clientId: clientRecord.id,
      platform,
      projectName,
      projectDetails,
      amount: parseFloat(amount),
      proposal,
      messageToClient,
      connectIn: parseInt(connectIn),
      costing: parseFloat(costing),
      serviceType,
      createdById: session.user.id,
    },
    include: { client: true },
  });
  return Response.json(newProposal, { status: 201 });
}
