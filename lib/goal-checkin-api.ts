import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canAccessCoachingNav } from "@/lib/membership";
import { prisma } from "@/lib/prisma";

export async function requireGoalCheckinMember() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.email) {
    return {
      error: NextResponse.json({ error: "Unauthorized." }, { status: 401 }),
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      membershipTier: true,
    },
  });

  if (!user) {
    return {
      error: NextResponse.json({ error: "Unauthorized." }, { status: 401 }),
    };
  }

  if (!canAccessCoachingNav(user.membershipTier)) {
    return {
      error: NextResponse.json(
        { error: "Goal check-ins are available on Memorable and Elite memberships." },
        { status: 403 },
      ),
    };
  }

  return { session, user };
}
