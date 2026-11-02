import type { MemberPdfViewKind } from "@/lib/my-resources-shared";

export type MemberPdfHrefParams = {
  kind: MemberPdfViewKind;
  file?: string;
  token?: string;
  resource?: string;
  fixitToken?: string;
  submissionId?: string;
  download?: boolean;
};

export function buildMemberPdfHref(params: MemberPdfHrefParams): string {
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
  if (params.submissionId) {
    search.set("submissionId", params.submissionId);
  }
  if (params.download) {
    search.set("download", "1");
  }
  return `/resources/pdf?${search.toString()}`;
}

/** @deprecated Use buildMemberPdfHref. */
export function buildMemberPdfViewerHref(params: MemberPdfHrefParams) {
  return buildMemberPdfHref(params);
}

/** @deprecated Use buildMemberPdfHref. */
export function buildMemberPdfOpenHref(params: MemberPdfHrefParams) {
  return buildMemberPdfHref(params);
}

export function hubMemberGuidePdfHrefIsAllowed(href: string): boolean {
  if (!href.startsWith("/resources/pdf?")) {
    return false;
  }
  const url = new URL(href, "https://www.lcbtraining.com");
  return url.searchParams.get("kind") === "guide" && Boolean(url.searchParams.get("file"));
}
