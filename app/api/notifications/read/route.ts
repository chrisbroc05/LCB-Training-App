import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type ReadBody = {
  notificationId?: number;
  markAll?: boolean;
};

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: ReadBody;
  try {
    body = (await request.json()) as ReadBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  try {
    if (body.markAll) {
      await prisma.notification.updateMany({
        where: {
          userId: session.user.id,
          read: false,
        },
        data: { read: true },
      });

      return NextResponse.json({ success: true });
    }

    const notificationId = body.notificationId;
    if (!notificationId || !Number.isFinite(notificationId)) {
      return NextResponse.json({ error: "Notification id is required." }, { status: 400 });
    }

    await prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId: session.user.id,
      },
      data: { read: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to mark notification as read", error);
    return NextResponse.json({ error: "Unable to update notification." }, { status: 500 });
  }
}
