export function isCompactPublicPage(pathname: string) {
  return (
    pathname === "/terms" ||
    pathname === "/privacy" ||
    pathname === "/waiver" ||
    pathname === "/sign" ||
    pathname.startsWith("/auth") ||
    pathname === "/marketing/unsubscribe" ||
    pathname === "/leads/unsubscribe" ||
    pathname.startsWith("/resources/success") ||
    pathname === "/program/parent/unsubscribe" ||
    pathname.startsWith("/messages/parent")
  );
}
