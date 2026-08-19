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
    pathname === "/privacy"
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
        className: "bg-[#1d4ed8] text-white",
      };
    case "MEMORABLE":
      return {
        label: "Memorable",
        className: "bg-[#2D6A4F] text-white",
      };
    case "ELITE":
      return {
        label: "Elite",
        className: "bg-[#B8860B] text-white",
      };
    default:
      return {
        label: "Free",
        className: "bg-[#4b5563] text-white",
      };
  }
}

export function getMobileFirstName(
  name: string | null | undefined,
  email: string | null | undefined,
) {
  const trimmedName = name?.trim();
  if (trimmedName) {
    return trimmedName.split(/\s+/)[0];
  }

  return email?.split("@")[0] || "Member";
}
