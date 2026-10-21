export type ResourceDownloadTokenPayload = {
  fileKey: string;
  email: string;
  exp: number;
  resourceSlug: string;
};

export function encodeResourceDownloadTokenPayload(payload: ResourceDownloadTokenPayload) {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

export function decodeResourceDownloadTokenPayload(encoded: string): ResourceDownloadTokenPayload | null {
  try {
    const json = Buffer.from(encoded, "base64url").toString("utf8");
    const parsed = JSON.parse(json) as ResourceDownloadTokenPayload;
    if (
      !parsed ||
      typeof parsed.fileKey !== "string" ||
      typeof parsed.email !== "string" ||
      typeof parsed.exp !== "number" ||
      typeof parsed.resourceSlug !== "string"
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}
