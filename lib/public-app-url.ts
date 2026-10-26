export function getPublicAppUrl(): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (appUrl) {
    return appUrl.replace(/\/$/, "");
  }
  if (process.env.NODE_ENV === "development") {
    const nextAuthUrl = process.env.NEXTAUTH_URL?.trim();
    if (nextAuthUrl) {
      return nextAuthUrl.replace(/\/$/, "");
    }
  }
  return "https://www.lcbtraining.com";
}
