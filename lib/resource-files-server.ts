import "server-only";

import { existsSync } from "fs";
import path from "path";

export function getPrivateResourceAbsolutePath(fileKey: string) {
  const normalized = fileKey.replace(/^\/+/, "").replace(/\.\./g, "");
  return path.join(process.cwd(), "private", normalized);
}

export function privateResourceFileExists(fileKey: string) {
  return existsSync(getPrivateResourceAbsolutePath(fileKey));
}

export function getGuideFilenameFromLegacyPublicName(filename: string) {
  return `guides/${filename}`;
}
