export function isValidEmailFormat(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function validateSecondEmail(params: {
  secondEmail: string | null | undefined;
  accountEmail: string;
}) {
  const trimmed = params.secondEmail?.trim() ?? "";
  if (!trimmed) {
    return { ok: true as const, email: null };
  }

  if (!isValidEmailFormat(trimmed)) {
    return { ok: false as const, error: "Enter a valid email address." };
  }

  if (trimmed.toLowerCase() === params.accountEmail.trim().toLowerCase()) {
    return {
      ok: false as const,
      error: "Second email must be different from your account email.",
    };
  }

  return { ok: true as const, email: trimmed };
}
