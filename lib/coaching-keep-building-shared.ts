export type KeepBuildingCoachingContext = {
  nextEligibleLabel: string;
  areasToImprove: string[];
  libraryDrillIds: string[];
  lastSubmissionId: string | null;
  weeklyFocusTitle: string | null;
};

export function shouldShowKeepBuildingCard(params: {
  effectiveLevel: string;
  canSubmit: boolean;
  hasPendingQuickReport: boolean;
}) {
  if (params.hasPendingQuickReport) {
    return false;
  }
  if (params.canSubmit) {
    return false;
  }
  return params.effectiveLevel === "CORE" || params.effectiveLevel === "PLUS";
}
