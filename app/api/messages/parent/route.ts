import { NextResponse } from "next/server";
import { listConversationMessages } from "@/lib/direct-messaging-server";
import { verifyParentMessagesToken } from "@/lib/parent-messages-token";
import { serializeRecruitingProfile } from "@/lib/recruiting-shared";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token")?.trim() ?? "";
  const enrollmentId = verifyParentMessagesToken(token);
  if (!enrollmentId) {
    return NextResponse.json({ error: "Invalid or expired link." }, { status: 403 });
  }

  const enrollment = await prisma.programEnrollment.findUnique({
    where: { id: enrollmentId },
    select: {
      id: true,
      user: {
        select: {
          name: true,
          email: true,
          recruitingProfile: true,
        },
      },
      conversation: {
        select: { id: true },
      },
    },
  });

  const recruiting = serializeRecruitingProfile(enrollment?.user.recruitingProfile ?? null);

  if (!enrollment?.conversation) {
    return NextResponse.json({
      playerName: enrollment?.user.name ?? enrollment?.user.email ?? "Player",
      messages: [],
      recruiting,
    });
  }

  const messages = await listConversationMessages(enrollment.conversation.id);

  return NextResponse.json({
    playerName: enrollment.user.name ?? enrollment.user.email,
    messages: messages.map((message) => ({
      ...message,
      createdAt: message.createdAt.toISOString(),
      readAt: message.readAt?.toISOString() ?? null,
    })),
    recruiting,
  });
}
