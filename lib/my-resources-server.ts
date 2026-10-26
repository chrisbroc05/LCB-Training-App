import "server-only";

import {
  canDownloadWorkoutPdfs,
  canViewPlaybook,
  getWorkoutAccessMode,
  type AccessUserFields,
} from "@/lib/access-shared";
import { createFixItPlanAccessToken } from "@/lib/fix-it-plan-access-token";
import {
  buildFixItPlanPath,
  FIX_IT_RESOURCE_SLUGS,
  getFixItPlanByResourceSlug,
  isFixItResourceSlug,
} from "@/lib/fix-it-plans-shared";
import {
  buildMemberPdfViewerHref,
  type MyResourceGroupItem,
  type MyResourceLinkItem,
  type MyResourcePdfItem,
  type MyResourcesViewModel,
  type MyResourceSection,
  type MyResourceTreeItem,
} from "@/lib/my-resources-shared";
import {
  buildGuidePdfApiHref,
  buildMobilityFilename,
  buildSpeedPhaseFilename,
  buildStrengthPhaseFilename,
  buildWorkoutPdfApiHref,
  MY_RESOURCES_AGE_GROUPS,
  MY_RESOURCES_GUIDE_FILENAMES,
  MY_RESOURCES_PROGRAMS,
  ROTATIONAL_POWER_FILENAME,
} from "@/lib/my-resources-catalog-shared";
import { createResourceDownloadToken } from "@/lib/resource-download-token";
import {
  canDownloadPaidResourceFile,
  listResourcePurchasesForAccount,
} from "@/lib/resources-access-server";
import { getResourceDefinition, getResourceDownloadLabel } from "@/lib/resources-shared";
import { STARTER_WORKOUT_PROGRAMS } from "@/lib/starter-workouts-in-app-shared";
import { getWorkoutResource, canAccessWorkoutResourceFile } from "@/lib/workout-resources";
import { prisma } from "@/lib/prisma";

function pdfItem(params: {
  id: string;
  label: string;
  viewerHref: string;
  downloadHref: string;
}): MyResourcePdfItem {
  return {
    kind: "pdf",
    id: params.id,
    label: params.label,
    viewerHref: params.viewerHref,
    downloadHref: params.downloadHref,
  };
}

function linkItem(params: {
  id: string;
  label: string;
  href: string;
  description?: string;
}): MyResourceLinkItem {
  return {
    kind: "link",
    id: params.id,
    label: params.label,
    href: params.href,
    description: params.description,
  };
}

function groupItem(id: string, label: string, children: MyResourceTreeItem[]): MyResourceGroupItem {
  return { kind: "group", id, label, children };
}

function buildFullWorkoutProgramsSection(access: AccessUserFields, isAdmin: boolean): MyResourceSection | null {
  if (!isAdmin && !canDownloadWorkoutPdfs(access)) {
    return null;
  }

  const programGroups: MyResourceTreeItem[] = MY_RESOURCES_PROGRAMS.map((program) => {
    if (program.key === "rotational") {
      return pdfItem({
        id: "rotational-power",
        label: program.title,
        viewerHref: buildMemberPdfViewerHref({ kind: "guide", file: ROTATIONAL_POWER_FILENAME }),
        downloadHref: buildGuidePdfApiHref(ROTATIONAL_POWER_FILENAME, true),
      });
    }

    const ageGroups: MyResourceTreeItem[] = MY_RESOURCES_AGE_GROUPS.map((age) => {
      if (program.key === "strength") {
        const phases: MyResourceTreeItem[] = ([1, 2, 3] as const).map((phase) => {
          const file = buildStrengthPhaseFilename(age.key, phase);
          return pdfItem({
            id: `strength-${age.key}-p${phase}`,
            label: `Phase ${phase}`,
            viewerHref: buildMemberPdfViewerHref({ kind: "workout", file }),
            downloadHref: buildWorkoutPdfApiHref(file, true),
          });
        });
        return groupItem(`strength-${age.key}`, age.label, phases);
      }

      if (program.key === "speed") {
        const phases: MyResourceTreeItem[] = ([1, 2, 3] as const).map((phase) => {
          const file = buildSpeedPhaseFilename(age.key, phase);
          return pdfItem({
            id: `speed-${age.key}-p${phase}`,
            label: `Phase ${phase}`,
            viewerHref: buildMemberPdfViewerHref({ kind: "workout", file }),
            downloadHref: buildWorkoutPdfApiHref(file, true),
          });
        });
        return groupItem(`speed-${age.key}`, age.label, phases);
      }

      const file = buildMobilityFilename(age.key);
      return pdfItem({
        id: `mobility-${age.key}`,
        label: age.label,
        viewerHref: buildMemberPdfViewerHref({ kind: "workout", file }),
        downloadHref: buildWorkoutPdfApiHref(file, true),
      });
    });

    return groupItem(`program-${program.key}`, program.title, ageGroups);
  });

  return {
    id: "workout-programs",
    title: "Workout Programs",
    items: programGroups,
  };
}

function buildStarterSection(access: AccessUserFields, isAdmin: boolean): MyResourceSection | null {
  const items: MyResourceTreeItem[] = [];

  if (isAdmin || getWorkoutAccessMode(access) === "starter_in_app") {
    items.push(
      linkItem({
        id: "starters-in-app",
        label: "Open 4-week starters in the app",
        href: "/workouts/starters",
        description: "Strength, Speed and Agility, and Mobility by age group (weeks 1-4).",
      }),
    );

    for (const program of STARTER_WORKOUT_PROGRAMS) {
      items.push(
        linkItem({
          id: `starter-program-${program.key}`,
          label: program.title,
          href: `/workouts/starters/${program.key}`,
        }),
      );
    }
  }

  if (!items.length) {
    return null;
  }

  return {
    id: "four-week-starters",
    title: "4-Week Starters",
    items,
  };
}

async function buildPurchasedStarterPdfs(params: {
  userId: string;
  email: string;
}): Promise<MyResourceTreeItem[]> {
  const purchases = await listResourcePurchasesForAccount(params);
  const items: MyResourceTreeItem[] = [];
  const seen = new Set<string>();

  for (const purchase of purchases) {
    const resource = getResourceDefinition(purchase.resourceSlug);
    if (!resource?.downloadFileKeys?.length) {
      continue;
    }

    for (const fileKey of resource.downloadFileKeys) {
      if (!fileKey.includes("4Week_Starter") && !fileKey.includes("Back_and_Arm")) {
        continue;
      }
      const dedupe = `${purchase.resourceSlug}:${fileKey}`;
      if (seen.has(dedupe)) {
        continue;
      }
      seen.add(dedupe);

      const allowed = await canDownloadPaidResourceFile({
        email: params.email,
        userId: params.userId,
        resourceSlug: purchase.resourceSlug,
        fileKey,
      });
      if (!allowed) {
        continue;
      }

      const token = createResourceDownloadToken({
        email: params.email,
        resourceSlug: purchase.resourceSlug,
        fileKey,
      });

      items.push(
        pdfItem({
          id: dedupe,
          label: getResourceDownloadLabel(fileKey),
          viewerHref: buildMemberPdfViewerHref({ kind: "purchase", token }),
          downloadHref: `/api/resources/download?token=${encodeURIComponent(token)}&download=1`,
        }),
      );
    }
  }

  return items;
}

function buildGuidesSection(access: AccessUserFields, isAdmin: boolean): MyResourceSection | null {
  const items: MyResourceTreeItem[] = [];

  for (const filename of MY_RESOURCES_GUIDE_FILENAMES) {
    if (!isAdmin && !canAccessWorkoutResourceFile(access, filename)) {
      continue;
    }
    const resource = getWorkoutResource(filename);
    const label = resource?.title ?? filename.replace(/^LCB_/, "").replace(/\.pdf$/, "").replace(/_/g, " ");
    items.push(
      pdfItem({
        id: `guide-${filename}`,
        label,
        viewerHref: buildMemberPdfViewerHref({ kind: "guide", file: filename }),
        downloadHref: buildGuidePdfApiHref(filename, true),
      }),
    );
  }

  if (!items.length) {
    return null;
  }

  return {
    id: "guides",
    title: "Guides",
    items,
  };
}

async function buildFixItSection(params: {
  userId: string;
  email: string;
  isAdmin: boolean;
}): Promise<MyResourceSection | null> {
  const items: MyResourceTreeItem[] = [];
  const purchases = await listResourcePurchasesForAccount(params);
  const purchaseSlugs = new Set(purchases.map((row) => row.resourceSlug));

  const grants = await prisma.userFixItGrant.findMany({
    where: { userId: params.userId },
    select: { resourceSlug: true },
  });
  const grantSlugs = new Set(grants.map((row) => row.resourceSlug));

  for (const slug of FIX_IT_RESOURCE_SLUGS) {
    if (!params.isAdmin && !purchaseSlugs.has(slug) && !grantSlugs.has(slug)) {
      continue;
    }
    const plan = getFixItPlanByResourceSlug(slug);
    if (!plan) {
      continue;
    }
    const token = createFixItPlanAccessToken({ email: params.email, resourceSlug: slug });
    items.push(
      linkItem({
        id: `fixit-${slug}`,
        label: plan.title,
        href: `${buildFixItPlanPath(slug)}?token=${encodeURIComponent(token)}`,
        description: "Open your plan page with drill videos and PDF.",
      }),
    );
  }

  if (!items.length) {
    return null;
  }

  return {
    id: "fix-it",
    title: "Fix-It Plans",
    items,
  };
}

function buildPlaybookSection(access: AccessUserFields, isAdmin: boolean): MyResourceSection | null {
  if (!isAdmin && !canViewPlaybook(access)) {
    return null;
  }

  return {
    id: "playbook",
    title: "The Playbook",
    items: [
      linkItem({
        id: "playbook-main",
        label: "Open The Next Level Playbook",
        href: "/playbook",
      }),
    ],
  };
}

async function mergeStarterPurchasesIntoSection(
  section: MyResourceSection | null,
  purchasedPdfs: MyResourceTreeItem[],
): Promise<MyResourceSection | null> {
  if (!purchasedPdfs.length && !section) {
    return null;
  }

  const items = [...(section?.items ?? []), ...purchasedPdfs];
  return {
    id: "four-week-starters",
    title: "4-Week Starters",
    items,
  };
}

export async function buildMyResourcesViewModel(params: {
  access: AccessUserFields;
  userId: string;
  email: string;
  isAdmin: boolean;
}): Promise<MyResourcesViewModel> {
  const purchasedStarterPdfs = await buildPurchasedStarterPdfs(params);

  const sections: MyResourceSection[] = [];

  const workoutPrograms = buildFullWorkoutProgramsSection(params.access, params.isAdmin);
  if (workoutPrograms) {
    sections.push(workoutPrograms);
  }

  const starters = await mergeStarterPurchasesIntoSection(
    buildStarterSection(params.access, params.isAdmin),
    purchasedStarterPdfs,
  );
  if (starters) {
    sections.push(starters);
  }

  const guides = buildGuidesSection(params.access, params.isAdmin);
  if (guides) {
    sections.push(guides);
  }

  const fixIt = await buildFixItSection(params);
  if (fixIt) {
    sections.push(fixIt);
  }

  const playbook = buildPlaybookSection(params.access, params.isAdmin);
  if (playbook) {
    sections.push(playbook);
  }

  return {
    sections,
    hasAny: sections.some((section) => section.items.length > 0),
  };
}

export async function userHasFixItAccess(userId: string, resourceSlug: string) {
  if (!isFixItResourceSlug(resourceSlug)) {
    return false;
  }
  const grant = await prisma.userFixItGrant.findUnique({
    where: { userId_resourceSlug: { userId, resourceSlug } },
    select: { id: true },
  });
  return Boolean(grant);
}
