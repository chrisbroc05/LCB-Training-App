import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canAccessGoalCheckin } from "@/lib/access-shared";
import { toAccessUserFields, userAccessSelect } from "@/lib/access-server";
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
      ...userAccessSelect,
    },
  });

  if (!user) {
    return {
      error: NextResponse.json({ error: "Unauthorized." }, { status: 401 }),
    };
  }

  const access = toAccessUserFields(user);
  if (!canAccessGoalCheckin(access)) {
    return {
      error: NextResponse.json(
        {
          error:
            "Goal check-ins are available with All-Access or the 12-Week Coaching Program.",
        },
        { status: 403 },
      ),
    };
  }

  return { session, user };
}
