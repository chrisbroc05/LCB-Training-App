import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isPushEnabled } from "@/lib/push-send";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isPushEnabled()) {
    return NextResponse.json({ error: "Push notifications are not configured." }, { status: 503 });
  }

  const body = (await request.json().catch(() => null)) as {
    endpoint?: string;
    keys?: { p256dh?: string; auth?: string };
  } | null;

  const endpoint = body?.endpoint?.trim();
  const p256dh = body?.keys?.p256dh?.trim();
  const auth = body?.keys?.auth?.trim();

  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json({ error: "Invalid subscription." }, { status: 400 });
  }

  const userAgent = request.headers.get("user-agent");

  await prisma.pushSubscription.upsert({
    where: {
      userId_endpoint: {
        userId: session.user.id,
        endpoint,
      },
    },
    create: {
      userId: session.user.id,
      endpoint,
      p256dh,
      auth,
      userAgent,
    },
    update: {
      p256dh,
      auth,
      userAgent,
      failureCount: 0,
    },
  });

  return NextResponse.json({ success: true });
}
