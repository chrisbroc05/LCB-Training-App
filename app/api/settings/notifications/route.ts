import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type NotificationsBody = {
  notifySubmissionResponse?: boolean;
  notifyGoalResponse?: boolean;
  notifyWeeklyCheckin?: boolean;
  notifyAnnouncements?: boolean;
};

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      notifySubmissionResponse: true,
      notifyGoalResponse: true,
      notifyWeeklyCheckin: true,
      notifyAnnouncements: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  return NextResponse.json({ preferences: user });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: NotificationsBody;
  try {
    body = (await request.json()) as NotificationsBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      notifySubmissionResponse: Boolean(body.notifySubmissionResponse),
      notifyGoalResponse: Boolean(body.notifyGoalResponse),
      notifyWeeklyCheckin: Boolean(body.notifyWeeklyCheckin),
      notifyAnnouncements: Boolean(body.notifyAnnouncements),
    },
  });

  return NextResponse.json({ success: true, message: "Preferences saved" });
}
