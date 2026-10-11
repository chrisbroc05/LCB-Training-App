import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { upsertTaskFeedback } from "@/lib/task-feedback-server";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ enrollmentId: string }> };

export async function POST(request: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { enrollmentId } = await context.params;
  const body = (await request.json().catch(() => null)) as {
    programDay?: number;
    taskKey?: string;
    liked?: boolean;
    comment?: string | null;
    taskCompletionId?: string | null;
  } | null;

  const enrollment = await prisma.programEnrollment.findUnique({
    where: { id: enrollmentId },
    select: { userId: true },
  });

  if (!enrollment) {
    return NextResponse.json({ error: "Enrollment not found." }, { status: 404 });
  }

  if (!body?.programDay || !body.taskKey) {
    return NextResponse.json({ error: "programDay and taskKey are required." }, { status: 400 });
  }

  try {
    const feedback = await upsertTaskFeedback({
      enrollmentId,
      userId: enrollment.userId,
      programDay: body.programDay,
      taskKey: body.taskKey,
      liked: body.liked,
      comment: body.comment,
      taskCompletionId: body.taskCompletionId,
    });
    return NextResponse.json({ feedback });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to save feedback." },
      { status: 400 },
    );
  }
}
