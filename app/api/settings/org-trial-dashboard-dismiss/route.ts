import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { resolveEffectiveLevel } from "@/lib/access-shared";
import { toAccessUserFields, userAccessSelect } from "@/lib/access-server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: userAccessSelect,
  });
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const access = toAccessUserFields(user);
  if (resolveEffectiveLevel(access) !== "ORG_TRIAL") {
    return NextResponse.json({ error: "Not on an organization trial." }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { orgTrialDashboardDismissedAt: new Date() },
  });

  return NextResponse.json({ success: true });
}
