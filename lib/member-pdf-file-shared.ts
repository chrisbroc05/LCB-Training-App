import { getFixItPdfFileKey, isFixItResourceSlug } from "@/lib/fix-it-plans-shared";
import { getWorkoutResource } from "@/lib/workout-resources";

export const MEMBER_WORKOUT_PDF_FILENAMES = [
  "LCB_Strength_8-11_Phase1.pdf",
  "LCB_Strength_8-11_Phase2.pdf",
  "LCB_Strength_8-11_Phase3.pdf",
  "LCB_Strength_12-15_Phase1.pdf",
  "LCB_Strength_12-15_Phase2.pdf",
  "LCB_Strength_12-15_Phase3.pdf",
  "LCB_Strength_16-18_Phase1.pdf",
  "LCB_Strength_16-18_Phase2.pdf",
  "LCB_Strength_16-18_Phase3.pdf",
  "LCB_Speed-Agility_8-11_Phase1.pdf",
  "LCB_Speed-Agility_8-11_Phase2.pdf",
  "LCB_Speed-Agility_8-11_Phase3.pdf",
  "LCB_Speed-Agility_12-15_Phase1.pdf",
  "LCB_Speed-Agility_12-15_Phase2.pdf",
  "LCB_Speed-Agility_12-15_Phase3.pdf",
  "LCB_Speed-Agility_16-18_Phase1.pdf",
  "LCB_Speed-Agility_16-18_Phase2.pdf",
  "LCB_Speed-Agility_16-18_Phase3.pdf",
  "LCB_Mobility_8-11.pdf",
  "LCB_Mobility_12-15.pdf",
  "LCB_Mobility_16-18.pdf",
] as const;

const WORKOUT_PDF_NAMES = new Set<string>(MEMBER_WORKOUT_PDF_FILENAMES);

/** Same private/ key as /api/workout-resources/[filename]. */
export function resolveMemberGuidePrivateFileKey(filename: string): string | null {
  const resource = getWorkoutResource(filename);
  if (!resource) {
    return null;
  }
  return resource.storageFileKey ?? `guides/${filename}`;
}

export function isMemberWorkoutPdfFilename(filename: string): boolean {
  return WORKOUT_PDF_NAMES.has(filename);
}

export function resolveMemberFixItPrivateFileKey(resourceSlug: string): string | null {
  if (!isFixItResourceSlug(resourceSlug)) {
    return null;
  }
  return getFixItPdfFileKey(resourceSlug);
}
