export type FixItPlanAccessTokenPayload = {
  email: string;
  resourceSlug: string;
};

export function encodeFixItPlanAccessTokenPayload(payload: FixItPlanAccessTokenPayload) {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

export function decodeFixItPlanAccessTokenPayload(encoded: string): FixItPlanAccessTokenPayload | null {
  try {
    const json = Buffer.from(encoded, "base64url").toString("utf8");
    const parsed = JSON.parse(json) as FixItPlanAccessTokenPayload;
    if (
      !parsed ||
      typeof parsed.email !== "string" ||
      typeof parsed.resourceSlug !== "string"
    ) {
      return null;
    }
    return {
      email: parsed.email.trim().toLowerCase(),
      resourceSlug: parsed.resourceSlug.trim(),
    };
  } catch {
    return null;
  }
}
