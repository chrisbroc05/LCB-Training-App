export function getRequestBaseUrl(request: Request) {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  if (host) {
    return `${proto}://${host}`;
  }
  const envUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL;
  if (envUrl?.trim()) {
    return envUrl.replace(/\/$/, "");
  }
  if (process.env.NODE_ENV === "production") {
    return "https://www.lcbtraining.com";
  }
  return "http://localhost:3000";
}

export function buildAppRedirectUrl(request: Request, pathname: string, searchParams?: Record<string, string>) {
  const url = new URL(pathname, getRequestBaseUrl(request));
  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      url.searchParams.set(key, value);
    }
  }
  return url;
}
