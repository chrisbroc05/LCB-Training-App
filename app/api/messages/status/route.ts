import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getEnrollmentForUser,
  getMessagingAccessState,
  getPlayerUnreadCount,
} from "@/lib/direct-messaging-server";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ access: "none", unreadCount: 0 });
  }

  const enrollment = await getEnrollmentForUser(session.user.id);
  const access = getMessagingAccessState(enrollment);
  const unreadCount = access === "none" ? 0 : await getPlayerUnreadCount(session.user.id);

  return NextResponse.json({ access, unreadCount });
}
