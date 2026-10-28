import { NextResponse } from "next/server";
import { getServerSession, type Session } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import {
  expireMembershipGraceNow,
  getDevSubscriptionSnapshot,
  simulateMembershipRenewalPaymentFailed,
} from "@/lib/dev-subscription-testing-server";
import { prisma } from "@/lib/prisma";

type Body = {
  action?: "simulate_payment_failed" | "expire_grace";
  userId?: string;
};

function devAdminGuard(session: Session | null) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  if (!session?.user?.id || !isAdminEmail(session.user.email)) {
    return NextResponse.json({ error: "Admin only." }, { status: 403 });
  }
  return null;
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  const blocked = devAdminGuard(session);
  if (blocked) {
    return blocked;
  }

  const url = new URL(request.url);
  const userIdQuery = url.searchParams.get("userId")?.trim() ?? "";
  if (userIdQuery) {
    const user = await prisma.user.findUnique({
      where: { id: userIdQuery },
      select: {
        id: true,
        email: true,
        playerFirstName: true,
        playerLastName: true,
      },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }
    const subscription = await getDevSubscriptionSnapshot(user.id);
    return NextResponse.json({
      userId: user.id,
      email: user.email,
      displayName:
        [user.playerFirstName, user.playerLastName].filter(Boolean).join(" ").trim() || user.email,
      subscription,
    });
  }

  const emailQuery = url.searchParams.get("email")?.trim() ?? "";
  if (emailQuery.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const users = await prisma.user.findMany({
    where: {
      email: { contains: emailQuery, mode: "insensitive" },
      membershipSubscription: { isNot: null },
    },
    select: {
      id: true,
      email: true,
      playerFirstName: true,
      playerLastName: true,
    },
    orderBy: { email: "asc" },
    take: 15,
  });

  const results = await Promise.all(
    users.map(async (user) => ({
      userId: user.id,
      email: user.email,
      displayName:
        [user.playerFirstName, user.playerLastName].filter(Boolean).join(" ").trim() || user.email,
      subscription: await getDevSubscriptionSnapshot(user.id),
    })),
  );

  return NextResponse.json({ results });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const blocked = devAdminGuard(session);
  if (blocked) {
    return blocked;
  }

  const body = (await request.json()) as Body;
  const userId = body.userId?.trim();
  if (!userId) {
    return NextResponse.json({ error: "Choose a player (userId required)." }, { status: 400 });
  }

  try {
    if (body.action === "simulate_payment_failed") {
      const subscription = await simulateMembershipRenewalPaymentFailed(userId);
      return NextResponse.json({ subscription });
    }
    if (body.action === "expire_grace") {
      await expireMembershipGraceNow(userId);
      const subscription = await getDevSubscriptionSnapshot(userId);
      return NextResponse.json({ success: true, subscription });
    }
    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
