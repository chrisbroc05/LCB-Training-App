import type { DatabaseTier } from "@/lib/membership";

export const MOBILE_MAX_WIDTH_PX = 767;

export function isPublicMobilePage(pathname: string) {
  return (
    pathname === "/" ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/details") ||
    pathname.startsWith("/inperson") ||
    pathname.startsWith("/coaches") ||
    pathname === "/terms" ||
    pathname === "/privacy" ||
    pathname === "/waiver" ||
    pathname === "/sign" ||
    pathname === "/marketing/unsubscribe" ||
    pathname === "/program/parent/unsubscribe" ||
    pathname.startsWith("/messages/parent")
  );
}

export function shouldUseMobileAppChrome(isLoggedIn: boolean, pathname: string) {
  return isLoggedIn && !isPublicMobilePage(pathname);
}

export function getMobileTierBadge(tier: DatabaseTier) {
  switch (tier) {
    case "BASIC":
      return {
        label: "Basic",
        className: "mobile-tier-pill-basic",
      };
    case "TWELVE_WEEK":
      return {
        label: "12-Week",
        className: "mobile-tier-pill-memorable",
      };
    case "MEMORABLE":
    case "ELITE":
      return {
        label: "Member",
        className: "mobile-tier-pill-memorable",
      };
    default:
      return {
        label: "Free",
        className: "mobile-tier-pill-free",
      };
  }
}

export function getMobileFirstName(
  name: string | null | undefined,
  email: string | null | undefined,
  playerFirstName?: string | null,
) {
  const fromPlayer = playerFirstName?.trim();
  if (fromPlayer) {
    return fromPlayer;
  }

  const trimmedName = name?.trim();
  if (trimmedName) {
    return trimmedName.split(/\s+/)[0];
  }

  return email?.split("@")[0] || "Member";
}
