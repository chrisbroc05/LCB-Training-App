export function isTestAccountEmail(email: string) {
  return email.toLowerCase().includes("+test");
}
