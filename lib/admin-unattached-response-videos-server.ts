import { prisma } from "@/lib/prisma";
import {
  formatR2VideoReference,
  listR2ObjectsWithPrefix,
  parseR2VideoReference,
} from "@/lib/r2";

export type UnattachedAdminResponseVideo = {
  r2Key: string;
  sizeBytes: number | null;
  lastModified: string | null;
  submissionId: string;
};

export async function listUnattachedAdminResponseVideos(params?: {
  since?: Date;
}): Promise<UnattachedAdminResponseVideo[]> {
  const attachedKeys = new Set<string>();
  const [swingRows, mentalRows] = await Promise.all([
    prisma.swingAnalysisSubmission.findMany({
      where: { responseVideoUrl: { not: null } },
      select: { responseVideoUrl: true },
    }),
    prisma.mentalGameSubmission.findMany({
      where: { responseVideoUrl: { not: null } },
      select: { responseVideoUrl: true },
    }),
  ]);

  for (const row of [...swingRows, ...mentalRows]) {
    const url = row.responseVideoUrl;
    if (!url) {
      continue;
    }
    const key = parseR2VideoReference(url);
    if (key) {
      attachedKeys.add(key);
    }
  }

  const objects = await listR2ObjectsWithPrefix("responses/");
  const unattached: UnattachedAdminResponseVideo[] = [];

  for (const object of objects) {
    if (attachedKeys.has(object.key)) {
      continue;
    }
    if (params?.since && object.lastModified && object.lastModified < params.since) {
      continue;
    }

    const parts = object.key.split("/");
    const submissionId = parts[1] ?? "";
    if (!submissionId) {
      continue;
    }

    unattached.push({
      r2Key: object.key,
      sizeBytes: object.sizeBytes,
      lastModified: object.lastModified?.toISOString() ?? null,
      submissionId,
    });
  }

  unattached.sort((a, b) => (b.lastModified ?? "").localeCompare(a.lastModified ?? ""));

  return unattached;
}

export function formatUnattachedResponseVideoReference(key: string) {
  return formatR2VideoReference(key);
}
