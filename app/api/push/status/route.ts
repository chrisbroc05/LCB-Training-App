import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isPushEnabled } from "@/lib/push-send";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const count = await prisma.pushSubscription.count({
    where: { userId: session.user.id },
  });

  return NextResponse.json({
    enabled: isPushEnabled(),
    subscribed: count > 0,
    subscriptionCount: count,
  });
}
