import "server-only";

import { prisma } from "@/lib/prisma";

/** Round down for a clean marketing number (nearest 10, or nearest 5 when under 50). */
export function roundDownActivePlayerCount(count: number): number {
  if (!Number.isFinite(count) || count <= 0) {
    return 0;
  }
  const step = count >= 50 ? 10 : 5;
  return Math.floor(count / step) * step;
}

/** Non-test player accounts used for the public "players training" line. */
export async function loadRoundedActivePlayerCount(): Promise<number> {
  const count = await prisma.user.count({
    where: { isTestAccount: false },
  });
  return roundDownActivePlayerCount(count);
}
