import "server-only";

import { getDrillLibraryVideoId, allDrillLibraryVideos } from "@/lib/drill-library-videos";
import { prisma } from "@/lib/prisma";

export async function ensureDrillLibraryCatalogSeeded() {
  const ids = allDrillLibraryVideos
    .map((video) => getDrillLibraryVideoId(video))
    .filter((id): id is string => Boolean(id));

  if (ids.length === 0) {
    return;
  }

  await prisma.drillLibraryCatalog.createMany({
    data: ids.map((vimeoId) => ({
      vimeoId,
      isStarterDrill: false,
      updatedAt: new Date(),
    })),
    skipDuplicates: true,
  });
}

export async function loadStarterDrillIdSet(): Promise<Set<string>> {
  await ensureDrillLibraryCatalogSeeded();
  const rows = await prisma.drillLibraryCatalog.findMany({
    where: { isStarterDrill: true },
    select: { vimeoId: true },
  });
  return new Set(rows.map((row) => row.vimeoId));
}

export async function setDrillStarterFlag(vimeoId: string, isStarterDrill: boolean) {
  await ensureDrillLibraryCatalogSeeded();
  await prisma.drillLibraryCatalog.upsert({
    where: { vimeoId },
    create: { vimeoId, isStarterDrill, updatedAt: new Date() },
    update: { isStarterDrill, updatedAt: new Date() },
  });
}
