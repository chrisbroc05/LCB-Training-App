import { buildPostAuthRedirectQueryString } from "@/lib/signup-auth-shared";

export async function waitForAuthenticatedSession(params?: {
  maxAttempts?: number;
  delayMs?: number;
}): Promise<boolean> {
  const maxAttempts = params?.maxAttempts ?? 15;
  const delayMs = params?.delayMs ?? 200;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const response = await fetch("/api/auth/session", { cache: "no-store" });
    const session = (await response.json().catch(() => ({}))) as {
      user?: { email?: string | null };
    };
    if (session.user?.email) {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  return false;
}

export async function resolvePostLoginRedirectPath(params: {
  redirectParam: string | null | undefined;
  callbackUrlParam: string | null | undefined;
  orgCodeFromQuery: string | null | undefined;
  fallbackPath: string;
}): Promise<string> {
  const query = buildPostAuthRedirectQueryString({
    redirectParam: params.redirectParam,
    callbackUrlParam: params.callbackUrlParam,
    orgCodeFromQuery: params.orgCodeFromQuery,
  });

  const response = await fetch(
    `/api/auth/post-login-redirect${query ? `?${query}` : ""}`,
    { cache: "no-store" },
  );
  if (!response.ok) {
    return params.fallbackPath;
  }

  const payload = (await response.json().catch(() => ({}))) as { path?: string };
  return payload.path ?? params.fallbackPath;
}

export async function completeSignupSessionAndRedirect(params: {
  redirectParam: string | null | undefined;
  callbackUrlParam: string | null | undefined;
  orgCodeFromQuery: string | null | undefined;
  fallbackPath: string;
}): Promise<{ ok: true; path: string } | { ok: false; reason: "session_timeout" | "redirect_failed" }> {
  const sessionReady = await waitForAuthenticatedSession();
  if (!sessionReady) {
    return { ok: false, reason: "session_timeout" };
  }

  const path = await resolvePostLoginRedirectPath(params);
  if (!path.startsWith("/")) {
    return { ok: false, reason: "redirect_failed" };
  }

  window.location.href = path;
  return { ok: true, path };
}
