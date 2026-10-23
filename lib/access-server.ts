import "server-only";

import {
  type AccessUserFields,
  type DrillViewAccessContext,
  resolveEffectiveLevel,
} from "@/lib/access-shared";
import type { DatabaseTier } from "@/lib/membership";
import { mergeOrgIntoAccessFields, userOrgAccessSelect } from "@/lib/org-server";
import { prisma } from "@/lib/prisma";

export type UserAccessSelect = {
  membershipTier: true;
  membershipLevel: true;
  membershipLevelExpiresAt: true;
  playbookLegacyAccess: true;
} & typeof userOrgAccessSelect;

export const userAccessSelect = {
  membershipTier: true,
  membershipLevel: true,
  membershipLevelExpiresAt: true,
  playbookLegacyAccess: true,
  ...userOrgAccessSelect,
} as const satisfies UserAccessSelect;

export function toAccessUserFields(
  user: Parameters<typeof mergeOrgIntoAccessFields>[0],
): AccessUserFields {
  return mergeOrgIntoAccessFields(user);
}

export async function loadAccessUserFields(userId: string): Promise<AccessUserFields | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: userAccessSelect,
  });
  if (!user) {
    return null;
  }
  return toAccessUserFields(user);
}

export async function loadDrillViewContext(userId: string): Promise<{
  access: AccessUserFields;
  starterDrillIds: Set<string>;
  grantedDrillIds: string[];
} | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: userAccessSelect,
  });
  if (!user) {
    return null;
  }

  const [catalogRows, swingSubmissions, mentalSubmissions] = await Promise.all([
    prisma.drillLibraryCatalog.findMany({
      where: { isStarterDrill: true },
      select: { vimeoId: true },
    }),
    prisma.swingAnalysisSubmission.findMany({
      where: { userId, respondedAt: { not: null } },
      select: { recommendedDrills: true },
    }),
    prisma.mentalGameSubmission.findMany({
      where: { userId, respondedAt: { not: null } },
      select: { recommendedDrills: true },
    }),
  ]);

  const grantedDrillIds = new Set<string>();
  for (const submission of [...swingSubmissions, ...mentalSubmissions]) {
    for (const drillId of submission.recommendedDrills) {
      const trimmed = drillId.trim();
      if (trimmed) {
        grantedDrillIds.add(trimmed);
      }
    }
  }

  return {
    access: toAccessUserFields(user),
    starterDrillIds: new Set(catalogRows.map((row) => row.vimeoId)),
    grantedDrillIds: [...grantedDrillIds],
  };
}

export function mergeDrillViewContext(
  access: AccessUserFields,
  starterDrillIds: ReadonlySet<string>,
  grantedDrillIds: readonly string[],
): DrillViewAccessContext {
  return {
    ...access,
    starterDrillIds,
    grantedDrillIds,
  };
}

export { resolveEffectiveLevel };
