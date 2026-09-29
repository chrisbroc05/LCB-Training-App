import "server-only";

import { prisma } from "@/lib/prisma";

export async function loadUserGrantedDrillIds(userId: string) {
  const [swingSubmissions, mentalSubmissions] = await Promise.all([
    prisma.swingAnalysisSubmission.findMany({
      where: { userId, respondedAt: { not: null } },
      select: { recommendedDrills: true },
    }),
    prisma.mentalGameSubmission.findMany({
      where: { userId, respondedAt: { not: null } },
      select: { recommendedDrills: true },
    }),
  ]);

  const ids = new Set<string>();
  for (const submission of [...swingSubmissions, ...mentalSubmissions]) {
    for (const drillId of submission.recommendedDrills) {
      const trimmed = drillId.trim();
      if (trimmed) {
        ids.add(trimmed);
      }
    }
  }

  return [...ids];
}
