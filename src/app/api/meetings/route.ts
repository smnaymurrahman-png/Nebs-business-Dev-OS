import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const meetings = await prisma.meeting.findMany({
    include: {
      user: { select: { name: true } },
      assignees: { include: { user: { select: { id: true, name: true } } } },
    },
    orderBy: { meetingDate: "asc" },
  });
  return Response.json(meetings);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const { meetingDate, meetingTopic, priorityLevel, assigneeIds } = body;
  const meeting = await prisma.meeting.create({
    data: {
      meetingDate: new Date(meetingDate),
      meetingTopic,
      priorityLevel,
      createdById: session.user.id,
      assignees: {
        create: (assigneeIds as string[]).map((userId: string) => ({ userId })),
      },
    },
    include: {
      user: { select: { name: true } },
      assignees: { include: { user: { select: { id: true, name: true } } } },
    },
  });
  return Response.json(meeting, { status: 201 });
}
