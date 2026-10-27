import "server-only";

import { toAccessUserFields, userAccessSelect } from "@/lib/access-server";
import type { CoachingSubmissionUserFields } from "@/lib/coaching-submissions-shared";
import {
  buildResourceHubMemberOverrides,
  buildResourceHubMemberSwingCard,
  type ResourcesHubMemberContext,
} from "@/lib/resources-hub-member-shared";
import { getResourcesForHub } from "@/lib/resources-shared";
import { prisma } from "@/lib/prisma";

export type { ResourcesHubMemberContext };

export async function loadResourcesHubMemberContext(
  userId: string,
): Promise<ResourcesHubMemberContext | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      ...userAccessSelect,
      freeSubmissionUsed: true,
      playbookSubmissionsUsed: true,
      coachingSubmissionsUsedThisMonth: true,
      coachingSubmissionPeriod: true,
      eliteRolloverCredits: true,
      orgTrialQuickReportUsed: true,
    },
  });

  if (!user) {
    return null;
  }

  const access = toAccessUserFields(user);
  const coachingUser = user as CoachingSubmissionUserFields;
  const resources = getResourcesForHub();

  return {
    overrides: buildResourceHubMemberOverrides(access, resources),
    swingCard: buildResourceHubMemberSwingCard(coachingUser),
  };
}
