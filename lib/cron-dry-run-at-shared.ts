/**
 * For cron dry runs only: optional ?at=<ISO datetime> simulates "now".
 * When dryRun is false, the caller must not use `atParam` (ignored here by using fresh Date).
 */
export function resolveCronDryRunNow(params: {
  dryRun: boolean;
  atParam: string | null | undefined;
}): { now: Date; simulatedAtIso: string; atQueryApplied: boolean } {
  if (!params.dryRun) {
    return {
      now: new Date(),
      simulatedAtIso: new Date().toISOString(),
      atQueryApplied: false,
    };
  }

  const raw = params.atParam?.trim();
  if (!raw) {
    const now = new Date();
    return { now, simulatedAtIso: now.toISOString(), atQueryApplied: false };
  }

  const now = new Date(raw);
  if (Number.isNaN(now.getTime())) {
    throw new Error('Invalid at= value: use an ISO 8601 datetime (e.g. 2026-11-07T07:00:00-06:00).');
  }

  return { now, simulatedAtIso: now.toISOString(), atQueryApplied: true };
}
