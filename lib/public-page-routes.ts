export function isCompactPublicPage(pathname: string) {
  return (
    pathname === "/terms" ||
    pathname === "/privacy" ||
    pathname === "/waiver" ||
    pathname === "/sign" ||
    pathname.startsWith("/auth") ||
    pathname === "/marketing/unsubscribe" ||
    pathname === "/program/parent/unsubscribe" ||
    pathname.startsWith("/messages/parent")
  );
}
