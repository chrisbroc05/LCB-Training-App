import fs from "node:fs";
import path from "node:path";

import { coachBioContent } from "@/lib/coach-bio-content";

/** When false, headshot is hidden on landing, /coach, and OG tags (file may remain in repo). */
export const COACH_PUBLIC_HEADSHOT_ENABLED = false;

/** True when the coach headshot should be shown publicly and the file exists. */
export function coachHeadshotFileExists(): boolean {
  if (!COACH_PUBLIC_HEADSHOT_ENABLED) {
    return false;
  }
  const relative = coachBioContent.coachPhotoPath.replace(/^public\//, "");
  const filePath = path.join(process.cwd(), "public", relative);
  return fs.existsSync(filePath);
}
