import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { sendGoalCheckinResponseEmail } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { shouldSendNotificationEmail } from "@/lib/user-notification-preferences";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type RespondBody = {
  coachResponse?: string;
};

export async function POST(request: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const params = await context.params;
  const submissionId = Number.parseInt(params.id, 10);
  if (!Number.isFinite(submissionId)) {
    return NextResponse.json({ error: "Invalid submission id." }, { status: 400 });
  }

  let body: RespondBody;
  try {
    body = (await request.json()) as RespondBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const coachResponse = body.coachResponse?.trim() ?? "";
  if (!coachResponse) {
    return NextResponse.json({ error: "Response text is required." }, { status: 400 });
  }

  const existing = await prisma.goalCheckin.findUnique({
    where: { id: submissionId },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  if (!existing) {
    return NextResponse.json({ error: "Submission not found." }, { status: 404 });
  }

  await prisma.goalCheckin.update({
    where: { id: submissionId },
    data: {
      coachResponse,
      status: "responded",
      respondedAt: new Date(),
    },
  });

  const memberName = existing.user.name?.trim() || existing.user.email;

  try {
    const shouldSendEmail = await shouldSendNotificationEmail(
      existing.userId,
      "notifyGoalResponse",
    );

    if (shouldSendEmail) {
      await sendGoalCheckinResponseEmail({
        toEmail: existing.user.email,
        displayName: memberName,
        coachResponse,
      });
    }
  } catch (error) {
    console.error("Failed to send goal check-in response email", error);
  }

  return NextResponse.json({ success: true });
}
