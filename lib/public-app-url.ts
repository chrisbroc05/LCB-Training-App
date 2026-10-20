export function getPublicAppUrl(): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (appUrl && !appUrl.includes("localhost")) {
    return appUrl.replace(/\/$/, "");
  }
  return "https://www.lcbtraining.com";
}
