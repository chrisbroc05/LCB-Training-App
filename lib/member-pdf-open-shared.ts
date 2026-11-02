import type { MemberPdfViewKind } from "@/lib/my-resources-shared";

export type MemberPdfOpenParams = {
  kind: MemberPdfViewKind;
  file?: string;
  token?: string;
  resource?: string;
  fixitToken?: string;
  submissionId?: string;
  download?: boolean;
};

export function buildMemberPdfOpenHref(params: MemberPdfOpenParams): string {
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
  return `/api/member/pdf/open?${search.toString()}`;
}

/** @deprecated Use buildMemberPdfOpenHref; kept as alias for existing call sites. */
export function buildMemberPdfViewerHref(params: MemberPdfOpenParams) {
  return buildMemberPdfOpenHref(params);
}

export function isMemberPdfOpenHref(href: string): boolean {
  return href.startsWith("/api/member/pdf/open?");
}

/** Relative redirect target after minting an open token (never use request.url origin). */
export function buildMemberPdfInlineRedirectPath(openToken: string): string {
  return `/api/member/pdf/inline?token=${encodeURIComponent(openToken)}`;
}

export function memberPdfHrefMustNotContainLocalhost(href: string): void {
  if (/localhost/i.test(href)) {
    throw new Error(`member PDF href must not contain localhost: ${href}`);
  }
}
