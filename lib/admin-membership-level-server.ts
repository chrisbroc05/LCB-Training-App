import "server-only";

import type { MembershipLevel } from "@prisma/client";
import { activateAllAccessMembership } from "@/lib/program-enrollment";
import { isMembershipLevelKey, type MembershipLevelKey } from "@/lib/membership-levels-shared";
import { prisma } from "@/lib/prisma";

export function parseAdminMembershipLevel(value: unknown): MembershipLevelKey | null {
  if (value === null || value === "") {
    return null;
  }
  if (typeof value !== "string" || !isMembershipLevelKey(value)) {
    return null;
  }
  return value;
}

export function parseAdminMembershipLevelExpiresAt(value: unknown): Date | null | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (value === null || value === "") {
    return null;
  }
  if (typeof value !== "string") {
    return null;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export async function applyAdminMembershipLevelGrant(params: {
  userId: string;
  membershipLevel: MembershipLevelKey | null;
  membershipLevelExpiresAt?: Date | null;
}) {
  await prisma.user.update({
    where: { id: params.userId },
    data: {
      membershipLevel: params.membershipLevel as MembershipLevel | null,
      membershipLevelExpiresAt: params.membershipLevelExpiresAt ?? null,
    },
  });

  if (params.membershipLevel === "ALL_ACCESS") {
    await activateAllAccessMembership(params.userId);
  }
}
