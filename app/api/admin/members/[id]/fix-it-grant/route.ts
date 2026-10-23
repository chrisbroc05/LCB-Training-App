import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import {
  adminMemberDetailSelect,
  serializeAdminMemberDetail,
} from "@/lib/admin-members";
import { resolveEffectiveLevel } from "@/lib/access-shared";
import { mergeOrgIntoAccessFields } from "@/lib/org-server";
import { FIX_IT_RESOURCE_SLUGS, isFixItResourceSlug } from "@/lib/fix-it-plans-shared";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const adminEmail = session.user.email.trim().toLowerCase();

  const { id: userId } = await context.params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const resourceSlug =
    body && typeof body === "object" && typeof (body as { resourceSlug?: string }).resourceSlug === "string"
      ? (body as { resourceSlug: string }).resourceSlug.trim()
      : "";

  if (!isFixItResourceSlug(resourceSlug)) {
    return NextResponse.json(
      { error: `resourceSlug must be one of: ${FIX_IT_RESOURCE_SLUGS.join(", ")}` },
      { status: 400 },
    );
  }

  const member = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      membershipTier: true,
      membershipLevel: true,
      membershipLevelExpiresAt: true,
      playbookLegacyAccess: true,
      organizationId: true,
      orgTrialQuickReportUsed: true,
      coreQuickReportNextEligibleAt: true,
      orgTeamId: true,
      organization: {
        select: {
          active: true,
          billingMode: true,
          coveredLevel: true,
          trialStartsAt: true,
          trialEndsAt: true,
        },
      },
      orgTeam: { select: { id: true, name: true, active: true } },
    },
  });

  if (!member) {
    return NextResponse.json({ error: "Member not found." }, { status: 404 });
  }

  const effective = resolveEffectiveLevel(mergeOrgIntoAccessFields(member));
  if (effective !== "PLUS" && effective !== "ALL_ACCESS") {
    return NextResponse.json(
      { error: "Fix-It grants are only available for Plus and All Access members." },
      { status: 400 },
    );
  }

  await prisma.userFixItGrant.upsert({
    where: {
      userId_resourceSlug: {
        userId,
        resourceSlug,
      },
    },
    create: {
      userId,
      resourceSlug,
      createdByAdminEmail: adminEmail,
    },
    update: {},
  });

  const refreshed = await prisma.user.findUnique({
    where: { id: userId },
    select: adminMemberDetailSelect,
  });

  if (!refreshed) {
    return NextResponse.json({ error: "Member not found." }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    message: "Fix-It plan access granted.",
    member: serializeAdminMemberDetail(refreshed),
  });
}
