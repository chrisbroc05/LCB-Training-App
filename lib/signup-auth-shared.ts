import { buildOrgJoinWelcomePath } from "@/lib/org-join-auth-shared";

export const SIGNUP_EMAIL_EXISTS_API_MESSAGE = "An account with this email already exists.";

export const SIGNUP_EMAIL_EXISTS_FRIENDLY_MESSAGE =
  "You already have an account. Sign in to continue.";

export function isSignupEmailAlreadyExistsError(message: string): boolean {
  const normalized = message.trim().toLowerCase();
  return (
    message === SIGNUP_EMAIL_EXISTS_API_MESSAGE ||
    normalized.includes("account with this email already exists")
  );
}

export function buildPostAuthRedirectQueryString(params: {
  redirectParam: string | null | undefined;
  callbackUrlParam: string | null | undefined;
  orgCodeFromQuery: string | null | undefined;
}): string {
  const destinationParams = new URLSearchParams();
  const redirectForApi =
    params.redirectParam?.trim() ||
    (params.orgCodeFromQuery?.trim()
      ? buildOrgJoinWelcomePath(params.orgCodeFromQuery.trim())
      : null);
  if (redirectForApi) {
    destinationParams.set("redirect", redirectForApi);
  }
  if (params.callbackUrlParam?.trim()) {
    destinationParams.set("callbackUrl", params.callbackUrlParam.trim());
  }
  return destinationParams.toString();
}
