/** Default user access row shape for anonymous or missing DB rows (client-safe). */
export const emptyAccessUserRow = {
  membershipTier: "FREE" as const,
  membershipLevel: null,
  membershipLevelExpiresAt: null,
  playbookLegacyAccess: false,
  organizationId: null,
  orgTrialQuickReportUsed: false,
  coreQuickReportNextEligibleAt: null,
  organization: null,
};
