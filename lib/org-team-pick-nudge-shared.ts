/**
 * One-time org team pick nudge copy and preview labels (client-safe).
 */

export const ORG_TEAM_PICK_NUDGE_PUSH_TITLE = "Quick one";
export const ORG_TEAM_PICK_NUDGE_PUSH_BODY =
  "Which team are you on? Pick it in the app so you get your team's weekly focus.";
export const ORG_TEAM_PICK_NUDGE_EMAIL_SUBJECT = "Quick one: which team are you on?";
export const ORG_TEAM_PICK_NUDGE_EMAIL_TEXT =
  "Quick one: which team are you on? Pick it in the app so you get your team's weekly focus.\n\nOpen Home or Today in the LCB Training app and choose your team.";
export const ORG_TEAM_PICK_NUDGE_URL = "/dashboard";

export type OrgTeamPickNudgeChannel = "push" | "email";

export type OrgTeamPickNudgeSkipReason =
  | "already_nudged"
  | "not_listed"
  | "test_account"
  | "no_contact";

export function formatOrgTeamPickNudgeSkipReason(reason: OrgTeamPickNudgeSkipReason): string {
  switch (reason) {
    case "already_nudged":
      return "Already nudged";
    case "not_listed":
      return "Team not listed";
    case "test_account":
      return "Test account";
    case "no_contact":
      return "No push and no email";
    default:
      return reason;
  }
}
