/**
 * Client-safe checks that member resource links match entitlements (hub + My Resources).
 */

import {
  canDownloadGuideFilename,
  canViewStarterWorkoutsInApp,
  type AccessUserFields,
} from "@/lib/access-shared";
import type { MemberPdfViewKind } from "@/lib/my-resources-shared";
import { MY_RESOURCES_GUIDE_FILENAMES } from "@/lib/my-resources-catalog-shared";
import { resolveResourceHubMemberOverride } from "@/lib/resources-hub-member-shared";
import { RESOURCE_DEFINITIONS } from "@/lib/resources-shared";
import { getWorkoutResource } from "@/lib/workout-resources";

export function memberPdfViewerIsAllowed(
  access: AccessUserFields,
  kind: MemberPdfViewKind,
  file: string,
): boolean {
  if (kind === "guide") {
    return getWorkoutResource(file) !== undefined && canDownloadGuideFilename(access, file);
  }
  return false;
}

export function memberStarterAppHrefIsAllowed(access: AccessUserFields, href: string): boolean {
  if (!canViewStarterWorkoutsInApp(access)) {
    return false;
  }
  return href === "/workouts/starters" || href.startsWith("/workouts/starters/");
}

export function listIncludedHubResourceOverrides(access: AccessUserFields) {
  const overrides: Array<{ slug: string; href: string }> = [];
  for (const resource of RESOURCE_DEFINITIONS) {
    const override = resolveResourceHubMemberOverride(access, resource);
    if (override) {
      overrides.push({ slug: resource.slug, href: override.href });
    }
  }
  return overrides;
}

export function listIncludedMyResourceGuideFilenames(access: AccessUserFields): string[] {
  return MY_RESOURCES_GUIDE_FILENAMES.filter((filename) =>
    canDownloadGuideFilename(access, filename),
  );
}

function hubGuideOpenHrefIsAllowed(access: AccessUserFields, href: string): boolean {
  const url = new URL(href, "https://lcbtraining.test");
  const kind = url.searchParams.get("kind") as MemberPdfViewKind | null;
  const file = url.searchParams.get("file");
  if (kind === "guide" && file) {
    return memberPdfViewerIsAllowed(access, "guide", file);
  }
  return false;
}

export function hubIncludedHrefIsAllowed(access: AccessUserFields, href: string): boolean {
  if (
    href.startsWith("/resources/pdf?") ||
    href.startsWith("/resources/view?")
  ) {
    return hubGuideOpenHrefIsAllowed(access, href);
  }
  return memberStarterAppHrefIsAllowed(access, href);
}
