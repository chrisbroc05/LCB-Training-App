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

function appendMemberPdfOpenSearchParams(search: URLSearchParams, params: MemberPdfOpenParams) {
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
}

/** Handoff page: mints a signed go URL while the member is signed in. */
export function buildMemberPdfHandoffHref(params: MemberPdfOpenParams): string {
  const search = new URLSearchParams();
  appendMemberPdfOpenSearchParams(search, params);
  return `/resources/pdf/handoff?${search.toString()}`;
}

/** Sessionless delivery URL (short-lived signed token). */
export function buildMemberPdfGoPath(openToken: string): string {
  return `/api/member/pdf/go?token=${encodeURIComponent(openToken)}`;
}

/** @deprecated Use buildMemberPdfHandoffHref. */
export function buildMemberPdfOpenHref(params: MemberPdfOpenParams): string {
  return buildMemberPdfHandoffHref(params);
}

/** @deprecated Use buildMemberPdfHandoffHref. */
export function buildMemberPdfViewerHref(params: MemberPdfOpenParams) {
  return buildMemberPdfHandoffHref(params);
}

export function isMemberPdfOpenHref(href: string): boolean {
  return (
    href.startsWith("/resources/pdf/handoff?") ||
    href.startsWith("/api/member/pdf/open?") ||
    href.startsWith("/api/member/pdf/go?")
  );
}

/** @deprecated Inline hop removed; use buildMemberPdfGoPath. */
export function buildMemberPdfInlineRedirectPath(openToken: string): string {
  return buildMemberPdfGoPath(openToken);
}

export function memberPdfHrefMustNotContainLocalhost(href: string): void {
  if (/localhost/i.test(href)) {
    throw new Error(`member PDF href must not contain localhost: ${href}`);
  }
}
