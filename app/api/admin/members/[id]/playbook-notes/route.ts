import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

type PlaybookNotesBody = {
  coachNotes?: string;
};

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await context.params;
  const body = (await request.json().catch(() => ({}))) as PlaybookNotesBody;
  const coachNotes = typeof body.coachNotes === "string" ? body.coachNotes : "";

  const progress = await prisma.playbookProgress.findUnique({
    where: { userId: id },
  });

  if (!progress) {
    return NextResponse.json({ error: "Playbook progress not found." }, { status: 404 });
  }

  const updated = await prisma.playbookProgress.update({
    where: { id: progress.id },
    data: { coachNotes },
    select: {
      coachNotes: true,
    },
  });

  return NextResponse.json(updated);
}
