/**
 * Admin client fetch helpers. Safari surfaces JSON.parse failures on HTML bodies as
 * "The string did not match the expected pattern." - always verify Content-Type and
 * use text + JSON.parse (or these helpers) instead of raw Response.json().
 */

export const ADMIN_FETCH_GENERIC_ERROR = "Something went wrong. Try again.";

export const ADMIN_FETCH_COULD_NOT_LOAD_JSON = "Couldn't load data. Try again.";

const BODY_LOG_MAX = 400;

function isLikelyJsonContentType(contentType: string) {
  return /json/i.test(contentType);
}

export function logAdminFetchFailure(params: {
  url: string;
  status: number;
  contentType: string;
  bodySnippet: string;
  context?: string;
}) {
  const prefix = params.context ? `[admin fetch] ${params.context}` : "[admin fetch]";
  console.error(prefix, {
    url: params.url,
    status: params.status,
    contentType: params.contentType || "(missing)",
    bodyPreview: params.bodySnippet.slice(0, BODY_LOG_MAX),
  });
}

export type AdminFetchJsonOk<T> = { ok: true; data: T };
export type AdminFetchJsonErr = { ok: false; userMessage: string };
export type AdminFetchJsonResult<T> = AdminFetchJsonOk<T> | AdminFetchJsonErr;

export async function readAdminJsonResponse<T>(
  response: Response,
  url: string,
  options?: { context?: string; okUserMessage?: string; notJsonUserMessage?: string },
): Promise<AdminFetchJsonResult<T>> {
  const contentType = response.headers.get("content-type") ?? "";
  const text = await response.text();
  const snippet = text.trim();
  const okUserMessage = options?.okUserMessage ?? ADMIN_FETCH_GENERIC_ERROR;
  const notJsonUserMessage = options?.notJsonUserMessage ?? ADMIN_FETCH_GENERIC_ERROR;

  if (!response.ok) {
    logAdminFetchFailure({
      url,
      status: response.status,
      contentType,
      bodySnippet: snippet,
      context: options?.context,
    });
    let message = okUserMessage;
    if (isLikelyJsonContentType(contentType) && snippet) {
      try {
        const parsed = JSON.parse(snippet) as { error?: string; message?: string };
        if (typeof parsed.error === "string" && parsed.error.trim()) {
          message = parsed.error.trim();
        } else if (typeof parsed.message === "string" && parsed.message.trim()) {
          message = parsed.message.trim();
        }
      } catch {
        // keep generic
      }
    }
    return { ok: false, userMessage: message };
  }

  if (!isLikelyJsonContentType(contentType)) {
    logAdminFetchFailure({
      url,
      status: response.status,
      contentType,
      bodySnippet: snippet,
      context: options?.context,
    });
    return { ok: false, userMessage: notJsonUserMessage };
  }

  try {
    const data = JSON.parse(snippet) as T;
    return { ok: true, data };
  } catch {
    logAdminFetchFailure({
      url,
      status: response.status,
      contentType,
      bodySnippet: snippet,
      context: options?.context,
    });
    return { ok: false, userMessage: notJsonUserMessage };
  }
}

export async function adminFetchJson<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
  options?: { context?: string; okUserMessage?: string; notJsonUserMessage?: string },
): Promise<AdminFetchJsonResult<T>> {
  const requestUrl =
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.href
        : (input as Request).url;
  let response: Response;
  try {
    response = await fetch(input, init);
  } catch (error) {
    console.error("[admin fetch] network error", { url: requestUrl, error });
    return {
      ok: false,
      userMessage: options?.okUserMessage ?? ADMIN_FETCH_GENERIC_ERROR,
    };
  }
  const resolvedUrl = response.url || String(requestUrl);
  return readAdminJsonResponse<T>(response, resolvedUrl, options);
}
