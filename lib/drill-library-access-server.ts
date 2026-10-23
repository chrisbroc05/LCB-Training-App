import "server-only";

import { loadMergedGrantedDrillIdsForUser } from "@/lib/drill-focus-grants-server";

/** Permanent coach picks plus active org / 2-week coach focus drills. */
export async function loadUserGrantedDrillIds(userId: string, now = new Date()) {
  return loadMergedGrantedDrillIdsForUser(userId, now);
}
