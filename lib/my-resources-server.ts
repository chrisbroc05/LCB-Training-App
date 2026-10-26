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
  type MyResourceGuideRowModel,
  type MyResourceLinkItem,
  type MyResourcePdfAction,
  type MyResourcePdfItem,
  type MyResourceProgramCardModel,
  type MyResourcesViewModel,
  type MyResourceSection,
  type MyResourceTreeItem,
  type MyResourceWorkoutProgramsSection,
} from "@/lib/my-resources-shared";
import {
  buildGuidePdfApiHref,
  buildMobilityFilename,
  buildSpeedPhaseFilename,
  buildStrengthPhaseFilename,
  buildWorkoutPdfApiHref,
  MY_RESOURCES_AGE_GROUPS,
  MY_RESOURCES_GUIDE_FILENAMES,
  MY_RESOURCES_PHASE_PILL_LABELS,
  MY_RESOURCES_PROGRAMS,
  ROTATIONAL_POWER_FILENAME,
} from "@/lib/my-resources-catalog-shared";
import {
  PROGRAM_AGE_GROUP_WORKOUT_AGE,
  type ProgramAgeGroup,
} from "@/lib/program-enrollment-shared";
import type { AgeGroupKey } from "@/lib/workout-programs";
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

function buildPhaseActions(
  buildFilename: (ageKey: AgeGroupKey, phase: 1 | 2 | 3) => string,
  ageKey: AgeGroupKey,
): MyResourcePdfAction[] {
  return ([1, 2, 3] as const).map((phase) => {
    const file = buildFilename(ageKey, phase);
    return {
      label: MY_RESOURCES_PHASE_PILL_LABELS[phase],
      viewerHref: buildMemberPdfViewerHref({ kind: "workout", file }),
      downloadHref: buildWorkoutPdfApiHref(file, true),
    };
  });
}

function buildFullWorkoutProgramsSection(
  access: AccessUserFields,
  isAdmin: boolean,
  preferredAgeGroup: AgeGroupKey | null,
): MyResourceWorkoutProgramsSection | null {
  if (!isAdmin && !canDownloadWorkoutPdfs(access)) {
    return null;
  }

  const programs: MyResourceProgramCardModel[] = MY_RESOURCES_PROGRAMS.map((program) => {
    if (program.key === "rotational") {
      return {
        key: program.key,
        title: program.title,
        description: program.description,
        layout: program.layout,
        singleActionLabel: program.singleActionLabel ?? "Open program",
        actionsByAge: {
          all: [
            {
              label: program.singleActionLabel ?? "Open program",
              viewerHref: buildMemberPdfViewerHref({ kind: "guide", file: ROTATIONAL_POWER_FILENAME }),
              downloadHref: buildGuidePdfApiHref(ROTATIONAL_POWER_FILENAME, true),
            },
          ],
        },
      };
    }

    const actionsByAge: MyResourceProgramCardModel["actionsByAge"] = {};

    for (const age of MY_RESOURCES_AGE_GROUPS) {
      if (program.key === "strength") {
        actionsByAge[age.key] = buildPhaseActions(buildStrengthPhaseFilename, age.key);
      } else if (program.key === "speed") {
        actionsByAge[age.key] = buildPhaseActions(buildSpeedPhaseFilename, age.key);
      } else {
        const file = buildMobilityFilename(age.key);
        actionsByAge[age.key] = [
          {
            label: program.singleActionLabel ?? "Open program",
            viewerHref: buildMemberPdfViewerHref({ kind: "workout", file }),
            downloadHref: buildWorkoutPdfApiHref(file, true),
          },
        ];
      }
    }

    return {
      key: program.key,
      title: program.title,
      description: program.description,
      layout: program.layout,
      singleActionLabel: program.singleActionLabel,
      actionsByAge,
    };
  });

  return {
    kind: "workout-programs",
    id: "workout-programs",
    title: "Workout Programs",
    defaultAgeGroup: preferredAgeGroup ?? MY_RESOURCES_AGE_GROUPS[0]?.key ?? null,
    programs,
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
    kind: "list",
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
  const guides: MyResourceGuideRowModel[] = [];

  for (const filename of MY_RESOURCES_GUIDE_FILENAMES) {
    if (!isAdmin && !canAccessWorkoutResourceFile(access, filename)) {
      continue;
    }
    const resource = getWorkoutResource(filename);
    const name = resource?.title ?? filename.replace(/^LCB_/, "").replace(/\.pdf$/, "").replace(/_/g, " ");
    guides.push({
      id: `guide-${filename}`,
      name,
      viewerHref: buildMemberPdfViewerHref({ kind: "guide", file: filename }),
      downloadHref: buildGuidePdfApiHref(filename, true),
    });
  }

  if (!guides.length) {
    return null;
  }

  return {
    kind: "guides",
    id: "guides",
    title: "Guides",
    guides,
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
    kind: "list",
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
    kind: "list",
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

async function resolvePreferredWorkoutAgeGroup(userId: string): Promise<AgeGroupKey | null> {
  const enrollment = await prisma.programEnrollment.findUnique({
    where: { userId },
    select: { ageGroup: true },
  });
  if (!enrollment?.ageGroup) {
    return null;
  }
  return PROGRAM_AGE_GROUP_WORKOUT_AGE[enrollment.ageGroup as ProgramAgeGroup] ?? null;
}

async function mergeStarterPurchasesIntoSection(
  section: MyResourceSection | null,
  purchasedPdfs: MyResourceTreeItem[],
): Promise<MyResourceSection | null> {
  if (!purchasedPdfs.length && !section) {
    return null;
  }

  const baseItems = section?.kind === "list" ? section.items : [];
  const items = [...baseItems, ...purchasedPdfs];
  return {
    kind: "list",
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
  const preferredWorkoutAgeGroup = await resolvePreferredWorkoutAgeGroup(params.userId);

  const sections: MyResourceSection[] = [];

  const workoutPrograms = buildFullWorkoutProgramsSection(
    params.access,
    params.isAdmin,
    preferredWorkoutAgeGroup,
  );
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

  const hasAny = sections.some((section) => {
    if (section.kind === "workout-programs") {
      return section.programs.length > 0;
    }
    if (section.kind === "guides") {
      return section.guides.length > 0;
    }
    return section.items.length > 0;
  });

  return {
    sections,
    hasAny,
    preferredWorkoutAgeGroup,
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
