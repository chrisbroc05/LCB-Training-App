/**
 * Club report member eligibility (client-safe).
 */

export type ClubReportMemberFlags = {
  isTestAccount: boolean;
  clubReportExcluded: boolean;
};

export function isClubReportMember(flags: ClubReportMemberFlags): boolean {
  return !flags.isTestAccount && !flags.clubReportExcluded;
}
