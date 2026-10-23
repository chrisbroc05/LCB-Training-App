/**
 * Review tracks that receive the structured written player evaluation + PDF (client-safe).
 * Reports queue membership for FREE_ONCE depends on admin free-swing response mode.
 */

export const QUICK_WRITTEN_REPORT_TRACKS = [
  "QUICK_SIX_WEEK",
  "ORG_TRIAL_QUICK",
  "FREE_ONCE",
] as const;

export type QuickWrittenReportTrack = (typeof QUICK_WRITTEN_REPORT_TRACKS)[number];

export function isQuickWrittenReportTrack(
  reviewTrack: string | null | undefined,
): reviewTrack is QuickWrittenReportTrack {
  return (
    reviewTrack != null &&
    (QUICK_WRITTEN_REPORT_TRACKS as readonly string[]).includes(reviewTrack)
  );
}

export function submissionHasWrittenPlayerReport(submission: {
  reportStrengths?: readonly string[];
  evaluationPdfR2Key?: string | null;
}): boolean {
  return (
    (submission.reportStrengths?.length ?? 0) > 0 ||
    Boolean(submission.evaluationPdfR2Key?.trim())
  );
}
