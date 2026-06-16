export function isAdminEmail(email?: string | null) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!email || !adminEmail) {
    return false;
  }

  const normalize = (value: string) => value.trim().replace(/^['"]|['"]$/g, "").toLowerCase();

  return normalize(email) === normalize(adminEmail);
}
