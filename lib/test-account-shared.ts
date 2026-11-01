const JOIN_FLOW_TEST_EMAIL_RE = /^joinflow[^@]*@example\.com$/i;

export function isTestAccountEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  return normalized.includes("+test") || JOIN_FLOW_TEST_EMAIL_RE.test(normalized);
}
