import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { jsonNoStore } from "@/lib/api-no-store";
import {
  getCoachUnreadCount,
  getOrCreateConversationForEnrollment,
  listCoachInbox,
} from "@/lib/direct-messaging-server";

export { dynamic, revalidate } from "@/lib/api-no-store";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    return jsonNoStore({ error: "Forbidden" }, { status: 403 });
  }

  const [inbox, unreadCount] = await Promise.all([listCoachInbox(), getCoachUnreadCount()]);

  return jsonNoStore({ inbox, unreadCount });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as { enrollmentId?: string } | null;
  if (typeof body?.enrollmentId !== "string" || !body.enrollmentId.trim()) {
    return NextResponse.json({ error: "Enrollment id is required." }, { status: 400 });
  }

  const conversation = await getOrCreateConversationForEnrollment(body.enrollmentId.trim());
  return NextResponse.json({ conversationId: conversation.id });
}
