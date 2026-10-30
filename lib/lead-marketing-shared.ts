import { normalizeLeadEmail } from "@/lib/leads-shared";

export const LEAD_MARKETING_EXCLUDED_REASON_ADMIN_EMAIL = "admin_email_alias";
export const LEAD_MARKETING_EXCLUDED_REASON_MANUAL = "manual_admin_exclude";

/** Gmail-style +alias: chris+tag@gmail.com matches chris@gmail.com */
export function normalizeEmailForAdminAliasMatch(email: string) {
  const normalized = normalizeLeadEmail(email);
  const atIndex = normalized.lastIndexOf("@");
  if (atIndex <= 0) {
    return normalized;
  }
  const local = normalized.slice(0, atIndex);
  const domain = normalized.slice(atIndex + 1);
  const baseLocal = local.split("+")[0] ?? local;
  return `${baseLocal}@${domain}`;
}

export function isAdminMarketingExcludedLeadEmail(
  email: string,
  adminEmail?: string | null,
) {
  const admin = adminEmail?.trim();
  if (!admin) {
    return false;
  }
  const normalizeAdmin = (value: string) =>
    value.trim().replace(/^['"]|['"]$/g, "").toLowerCase();

  return (
    normalizeEmailForAdminAliasMatch(email) ===
    normalizeEmailForAdminAliasMatch(normalizeAdmin(admin))
  );
}
