import fs from "node:fs";
import path from "node:path";

import { coachBioContent } from "@/lib/coach-bio-content";

/** True when public/images/coach-broc.jpg is present (optional headshot slot). */
export function coachHeadshotFileExists(): boolean {
  const relative = coachBioContent.coachPhotoPath.replace(/^public\//, "");
  const filePath = path.join(process.cwd(), "public", relative);
  return fs.existsSync(filePath);
}
