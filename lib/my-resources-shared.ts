/** Client-safe types and viewer URL helpers for My Resources. */

import type { AgeGroupKey } from "@/lib/workout-programs";
import type { MyResourcesProgramKey } from "@/lib/my-resources-catalog-shared";

export type MyResourcesTab = "browse" | "mine";

export type MyResourceLinkItem = {
  kind: "link";
  id: string;
  label: string;
  href: string;
  description?: string;
};

export type MyResourcePdfItem = {
  kind: "pdf";
  id: string;
  label: string;
  viewerHref: string;
  downloadHref: string;
};

export type MyResourceGroupItem = {
  kind: "group";
  id: string;
  label: string;
  children: MyResourceTreeItem[];
};

export type MyResourceTreeItem = MyResourceLinkItem | MyResourcePdfItem | MyResourceGroupItem;

export type MyResourcePdfAction = {
  label: string;
  viewerHref: string;
  downloadHref: string;
};

export type MyResourceProgramCardModel = {
  key: MyResourcesProgramKey;
  title: string;
  description: string;
  layout: "phases" | "single";
  singleActionLabel?: string;
  /** Per age group: phase actions or single open action. Rotational uses key `all`. */
  actionsByAge: Partial<
    Record<AgeGroupKey | "all", MyResourcePdfAction[]>
  >;
};

export type MyResourceGuideRowModel = {
  id: string;
  name: string;
  viewerHref: string;
  downloadHref: string;
};

export type MyResourceListSection = {
  kind: "list";
  id: string;
  title: string;
  items: MyResourceTreeItem[];
};

export type MyResourceWorkoutProgramsSection = {
  kind: "workout-programs";
  id: string;
  title: string;
  defaultAgeGroup: AgeGroupKey | null;
  programs: MyResourceProgramCardModel[];
};

export type MyResourceGuidesSection = {
  kind: "guides";
  id: string;
  title: string;
  guides: MyResourceGuideRowModel[];
};

export type MyResourceSection =
  | MyResourceListSection
  | MyResourceWorkoutProgramsSection
  | MyResourceGuidesSection;

export type MyResourcesViewModel = {
  sections: MyResourceSection[];
  hasAny: boolean;
  preferredWorkoutAgeGroup: AgeGroupKey | null;
};

export type MemberPdfViewKind = "workout" | "guide" | "purchase" | "fixit";

export function buildMemberPdfViewerHref(params: {
  kind: MemberPdfViewKind;
  file?: string;
  token?: string;
  resource?: string;
  fixitToken?: string;
}) {
  const search = new URLSearchParams();
  search.set("kind", params.kind);
  if (params.file) {
    search.set("file", params.file);
  }
  if (params.token) {
    search.set("token", params.token);
  }
  if (params.resource) {
    search.set("resource", params.resource);
  }
  if (params.fixitToken) {
    search.set("fixitToken", params.fixitToken);
  }
  return `/resources/view?${search.toString()}`;
}

export function parseResourcesTabParam(value: string | null | undefined): MyResourcesTab {
  return value === "mine" ? "mine" : "browse";
}
