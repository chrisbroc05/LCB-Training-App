import type { SignupRequestPayload } from "@/lib/signup-shared";

export async function submitSignupRequest(
  payload: SignupRequestPayload & {
    selectedMembershipTier?: string;
    signupSource?: string;
  },
) {
  const response = await fetch("/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = (await response.json().catch(() => ({}))) as { error?: string };

  if (!response.ok) {
    return { ok: false as const, error: data.error ?? "Unable to create account." };
  }

  return { ok: true as const };
}
