import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canAccessPlaybook } from "@/lib/membership";
import { toAccessUserFields, userAccessSelect } from "@/lib/access-server";
import { prisma } from "@/lib/prisma";

export async function requirePlaybookMember() {
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
  if (
    !canAccessPlaybook(
      access.membershipTier,
      access.playbookLegacyAccess,
      access.membershipLevel,
      access.membershipLevelExpiresAt,
    )
  ) {
    return {
      error: NextResponse.json(
        { error: "The Next Level Playbook is available with Plus, All-Access, or the 12-Week Program." },
        { status: 403 },
      ),
    };
  }

  return { session, user };
}
