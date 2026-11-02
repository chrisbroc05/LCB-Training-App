import "server-only";

import { existsSync } from "fs";
import path from "path";
import {
  isMemberWorkoutPdfFilename,
  resolveMemberFixItPrivateFileKey,
  resolveMemberGuidePrivateFileKey,
} from "@/lib/member-pdf-file-shared";
import { getPrivateResourceAbsolutePath, privateResourceFileExists } from "@/lib/resource-files-server";
import type { MemberPdfViewKind } from "@/lib/my-resources-shared";

export {
  resolveMemberGuidePrivateFileKey,
  resolveMemberFixItPrivateFileKey as resolveMemberFixItFileKey,
} from "@/lib/member-pdf-file-shared";

export function resolveMemberGuideAbsolutePath(filename: string): string | null {
  const fileKey = resolveMemberGuidePrivateFileKey(filename);
  if (!fileKey) {
    return null;
  }
  return getPrivateResourceAbsolutePath(fileKey);
}

export function memberGuidePrivateFileExists(filename: string): boolean {
  const fileKey = resolveMemberGuidePrivateFileKey(filename);
  if (!fileKey) {
    return false;
  }
  return privateResourceFileExists(fileKey);
}

export function resolveMemberWorkoutAbsolutePath(filename: string): string | null {
  if (!isMemberWorkoutPdfFilename(filename)) {
    return null;
  }
  const privatePath = path.join(process.cwd(), "private", "workouts", filename);
  if (existsSync(privatePath)) {
    return privatePath;
  }
  const publicPath = path.join(process.cwd(), "public", "workouts", filename);
  if (existsSync(publicPath)) {
    return publicPath;
  }
  return null;
}

export function memberPdfKindUsesPrivateFileKey(kind: MemberPdfViewKind): boolean {
  return kind === "guide" || kind === "workout" || kind === "fixit";
}
