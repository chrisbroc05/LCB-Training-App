export function normalizeOrgJoinCodeParam(code: string): string {
  return code.trim();
}

export function buildOrgJoinWelcomePath(code: string): string {
  return `/join/${encodeURIComponent(normalizeOrgJoinCodeParam(code))}/welcome`;
}

export function buildOrgJoinLandingPath(code: string): string {
  return `/join/${encodeURIComponent(normalizeOrgJoinCodeParam(code))}`;
}

/** Auth signup entry for org join (one hop to signup with post-auth welcome). */
export function buildOrgJoinAuthSignupHref(code: string): string {
  const normalized = normalizeOrgJoinCodeParam(code);
  const params = new URLSearchParams({
    mode: "signup",
    redirect: buildOrgJoinWelcomePath(normalized),
    orgCode: normalized,
  });
  return `/auth?${params.toString()}`;
}

export function buildOrgJoinAuthSignInHref(code: string): string {
  const normalized = normalizeOrgJoinCodeParam(code);
  const params = new URLSearchParams({
    mode: "login",
    redirect: buildOrgJoinLandingPath(normalized),
    orgCode: normalized,
  });
  return `/auth?${params.toString()}`;
}

const JOIN_PATH_RE = /^\/join\/([^/?#]+)(?:\/welcome)?\/?$/;

export function parseOrgJoinRedirectPath(path: string | null | undefined): string | null {
  if (!path?.startsWith("/join/")) {
    return null;
  }
  const match = path.match(JOIN_PATH_RE);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

export function resolveOrgJoinPostAuthPath(params: {
  redirectPath: string | null | undefined;
  orgCodeFromQuery: string | null | undefined;
  userAlreadyJoinedOrg: boolean;
}): string | null {
  const code =
    parseOrgJoinRedirectPath(params.redirectPath ?? null) ??
    (params.orgCodeFromQuery?.trim() || null);
  if (!code) {
    return null;
  }
  if (params.userAlreadyJoinedOrg) {
    return buildOrgJoinWelcomePath(code);
  }
  return buildOrgJoinLandingPath(code);
}
