import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import {
  getConversationById,
  listConversationMessages,
  markConversationRead,
  sendConversationMessage,
} from "@/lib/direct-messaging-server";

type RouteContext = {
  params: Promise<{ conversationId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { conversationId } = await context.params;
  const conversation = await getConversationById(conversationId);
  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
  }

  const messages = await listConversationMessages(conversation.id);

  return NextResponse.json({
    conversation: {
      id: conversation.id,
      enrollmentId: conversation.enrollmentId,
      playerName: conversation.enrollment.user.name ?? conversation.enrollment.user.email,
      playerEmail: conversation.enrollment.user.email,
    },
    messages: messages.map((message) => ({
      ...message,
      createdAt: message.createdAt.toISOString(),
      readAt: message.readAt?.toISOString() ?? null,
    })),
  });
}

export async function POST(request: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !isAdminEmail(session.user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { conversationId } = await context.params;
  const conversation = await getConversationById(conversationId);
  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
  }

  const body = (await request.json().catch(() => null)) as { body?: string } | null;
  if (typeof body?.body !== "string") {
    return NextResponse.json({ error: "Message body is required." }, { status: 400 });
  }

  try {
    const message = await sendConversationMessage({
      conversationId: conversation.id,
      senderUserId: session.user.id,
      fromCoach: true,
      body: body.body,
      playerUserId: conversation.enrollment.user.id,
      playerName: conversation.enrollment.user.name,
      playerEmail: conversation.enrollment.user.email,
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

export async function PATCH(_request: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { conversationId } = await context.params;
  await markConversationRead({ conversationId, forCoach: true });
  return NextResponse.json({ success: true });
}
