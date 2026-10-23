import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { jsonNoStore } from "@/lib/api-no-store";
import {
  getPlayerUnreadCount,
  listConversationMessages,
  markConversationRead,
  resolvePlayerConversation,
  sendConversationMessage,
} from "@/lib/direct-messaging-server";
import { getMessagingReplyCopy } from "@/lib/access-shared";
import { requireUnder13ParentUnlockResponse } from "@/lib/legal-under13-guard-server";
import { prisma } from "@/lib/prisma";

export { dynamic, revalidate } from "@/lib/api-no-store";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resolved = await resolvePlayerConversation(session.user.id);
  if (!resolved || resolved.access === "none") {
    return NextResponse.json({ error: "Messaging is not available." }, { status: 403 });
  }

  const messages = await listConversationMessages(resolved.conversation.id);
  const replyCopy = getMessagingReplyCopy(resolved.accessUser);

  return jsonNoStore({
    access: resolved.access,
    replyCopy,
    conversationId: resolved.conversation.id,
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

  const under13LockError = await requireUnder13ParentUnlockResponse(session.user.id);
  if (under13LockError) {
    return under13LockError;
  }

  const resolved = await resolvePlayerConversation(session.user.id);
  if (!resolved || resolved.access !== "active") {
    return NextResponse.json({ error: "Messaging is read-only." }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as { body?: string } | null;
  if (typeof body?.body !== "string") {
    return NextResponse.json({ error: "Message body is required." }, { status: 400 });
  }

  const profile =
    resolved.enrollment?.user ??
    (await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, email: true },
    }));
  const playerUserId = profile?.id ?? session.user.id;
  const playerName = profile?.name ?? null;
  const playerEmail = profile?.email ?? session.user.email ?? "";

  try {
    const message = await sendConversationMessage({
      conversationId: resolved.conversation.id,
      senderUserId: session.user.id,
      fromCoach: false,
      body: body.body,
      playerUserId,
      playerName,
      playerEmail,
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

  const resolved = await resolvePlayerConversation(session.user.id);
  if (!resolved?.conversation) {
    return NextResponse.json({ success: true });
  }

  await markConversationRead({
    conversationId: resolved.conversation.id,
    forCoach: false,
  });

  const unreadCount = await getPlayerUnreadCount(session.user.id);
  return jsonNoStore({ success: true, unreadCount });
}
