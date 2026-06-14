export function isAdminEmail(email?: string | null) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!email || !adminEmail) {
    return false;
  }

  return email.toLowerCase() === adminEmail.toLowerCase();
}
