export type CheckoutResponse = {
  url?: string;
  error?: string;
  code?: string;
};

export async function postCheckout(url: string, body?: unknown): Promise<CheckoutResponse> {
  const response = await fetch(url, {
    method: "POST",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  const payload = (await response.json().catch(() => ({}))) as CheckoutResponse;

  if (!response.ok) {
    if (payload.code === "TERMS_REQUIRED") {
      throw new Error(
        payload.error ??
          "Please accept the updated Terms of Service, Privacy Policy, and Waiver first.",
      );
    }

    throw new Error(payload.error ?? "Unable to start checkout.");
  }

  if (!payload.url) {
    throw new Error(payload.error ?? "Unable to start checkout.");
  }

  return payload;
}
