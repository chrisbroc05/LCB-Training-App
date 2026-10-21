import { allDrillLibraryVideos, getDrillLibraryVideoId } from "@/lib/drill-library-videos";
import {
  FIX_IT_PLANS,
  FIX_IT_PLANS_META,
  type FixItPlanGenerated,
} from "@/lib/fix-it-plans-data.generated";

export const FIX_IT_HUB_RESOURCE_SLUG = "fix-it-hitting-plans";

export const FIX_IT_RESOURCE_SLUGS = ["fixit-stay-closed", "fixit-hit-the-brakes"] as const;

export type FixItResourceSlug = (typeof FIX_IT_RESOURCE_SLUGS)[number];

export { FIX_IT_PLANS, FIX_IT_PLANS_META };

export function isFixItResourceSlug(slug: string): slug is FixItResourceSlug {
  return (FIX_IT_RESOURCE_SLUGS as readonly string[]).includes(slug);
}

export function getFixItPlanByResourceSlug(slug: string): FixItPlanGenerated | null {
  return FIX_IT_PLANS.find((plan) => plan.resourceSlug === slug) ?? null;
}

export function getFixItPlanBySlug(slug: string): FixItPlanGenerated | null {
  return FIX_IT_PLANS.find((plan) => plan.slug === slug) ?? null;
}

export function getFixItPdfFileKey(resourceSlug: string) {
  const plan = getFixItPlanByResourceSlug(resourceSlug);
  if (!plan) {
    return null;
  }
  return `resources/fix-it/${plan.pdfFilename}`;
}

function normalizeDrillTitle(title: string) {
  return title.trim().toLowerCase();
}

const drillByNormalizedTitle = new Map(
  allDrillLibraryVideos.map((video) => [normalizeDrillTitle(video.title), video]),
);

export function resolveFixItDrillVideoByTitle(title: string | null | undefined) {
  if (!title?.trim()) {
    return null;
  }
  return drillByNormalizedTitle.get(normalizeDrillTitle(title)) ?? null;
}

export function resolveFixItDrillVimeoId(title: string | null | undefined) {
  const video = resolveFixItDrillVideoByTitle(title);
  if (!video) {
    return null;
  }
  return getDrillLibraryVideoId(video);
}

export function buildFixItPlanPath(resourceSlug: string) {
  return `/fix-it/${resourceSlug}`;
}
