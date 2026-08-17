import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canAccessPlaybook } from "@/lib/membership";
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
      membershipTier: true,
    },
  });

  if (!user) {
    return {
      error: NextResponse.json({ error: "Unauthorized." }, { status: 401 }),
    };
  }

  if (!canAccessPlaybook(user.membershipTier)) {
    return {
      error: NextResponse.json(
        { error: "The Playbook is available on Basic, Memorable, and Elite memberships." },
        { status: 403 },
      ),
    };
  }

  return { session, user };
}
