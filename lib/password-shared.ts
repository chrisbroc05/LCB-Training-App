export const MIN_PASSWORD_LENGTH = 8;

export const PASSWORD_RESET_GENERIC_MESSAGE =
  "If an account exists for that email, we sent a reset link.";

export const PASSWORD_UPDATED_MESSAGE = "Your password was updated.";

export function validatePassword(password: string): string | null {
  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`;
  }
  return null;
}

export function validatePasswordConfirmation(
  password: string,
  confirmPassword: string,
): string | null {
  const passwordError = validatePassword(password);
  if (passwordError) {
    return passwordError;
  }
  if (password !== confirmPassword) {
    return "New password and confirmation do not match.";
  }
  return null;
}
