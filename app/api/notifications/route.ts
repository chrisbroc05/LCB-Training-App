import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: [{ read: "asc" }, { createdAt: "desc" }],
    });

    const unreadCount = notifications.filter((notification) => !notification.read).length;

    return NextResponse.json({
      notifications: notifications.map((notification) => ({
        id: notification.id,
        title: notification.title,
        body: notification.body,
        type: notification.type,
        read: notification.read,
        linkUrl: notification.linkUrl,
        createdAt: notification.createdAt.toISOString(),
      })),
      unreadCount,
    });
  } catch (error) {
    console.error("Failed to load notifications", error);
    return NextResponse.json({ notifications: [], unreadCount: 0 });
  }
}
