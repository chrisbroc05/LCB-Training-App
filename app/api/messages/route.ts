import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getEnrollmentForUser,
  getMessagingAccessState,
  getOrCreateConversation,
  listConversationMessages,
  markConversationRead,
  sendConversationMessage,
} from "@/lib/direct-messaging-server";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const enrollment = await getEnrollmentForUser(session.user.id);
  const access = getMessagingAccessState(enrollment);
  if (access === "none" || !enrollment) {
    return NextResponse.json({ error: "Messaging is not available." }, { status: 403 });
  }

  const conversation = enrollment.conversation ?? (await getOrCreateConversation(enrollment.id));
  const messages = await listConversationMessages(conversation.id);

  return NextResponse.json({
    access,
    conversationId: conversation.id,
    messages: messages.map((message) => ({
      ...message,
      createdAt: message.createdAt.toISOString(),
      readAt: message.readAt?.toISOString() ?? null,
    })),
  });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const enrollment = await getEnrollmentForUser(session.user.id);
  const access = getMessagingAccessState(enrollment);
  if (access !== "active" || !enrollment) {
    return NextResponse.json({ error: "Messaging is read-only." }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as { body?: string } | null;
  if (typeof body?.body !== "string") {
    return NextResponse.json({ error: "Message body is required." }, { status: 400 });
  }

  try {
    const conversation = enrollment.conversation ?? (await getOrCreateConversation(enrollment.id));
    const message = await sendConversationMessage({
      conversationId: conversation.id,
      senderUserId: session.user.id,
      fromCoach: false,
      body: body.body,
      playerUserId: enrollment.user.id,
      playerName: enrollment.user.name,
      playerEmail: enrollment.user.email,
    });

    return NextResponse.json({
      message: {
        id: message.id,
        body: message.body,
        fromCoach: message.fromCoach,
        createdAt: message.createdAt.toISOString(),
        readAt: message.readAt?.toISOString() ?? null,
        senderUserId: message.senderUserId,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to send message." },
      { status: 400 },
    );
  }
}

export async function PATCH() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const enrollment = await getEnrollmentForUser(session.user.id);
  if (!enrollment?.conversation) {
    return NextResponse.json({ success: true });
  }

  await markConversationRead({
    conversationId: enrollment.conversation.id,
    forCoach: false,
  });

  return NextResponse.json({ success: true });
}
