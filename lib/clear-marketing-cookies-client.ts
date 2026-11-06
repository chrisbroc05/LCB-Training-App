/** Clears httpOnly marketing cookies (lead id + quiz attempt) after sign-out. */
export async function clearMarketingCookiesOnClient(): Promise<void> {
  try {
    await fetch("/api/auth/clear-marketing-cookies", { method: "POST", credentials: "include" });
  } catch {
    // Non-fatal; session is already cleared.
  }
}
