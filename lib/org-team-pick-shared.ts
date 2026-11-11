/**
 * Org team pick banner / join / admin helpers (client-safe).
 */

export const ORG_TEAM_NOT_LISTED_VALUE = "__not_listed__";

export const ORG_TEAM_NOT_LISTED_LABEL = "My team isn't listed";

export function userNeedsOrgTeamPick(params: {
  organizationId?: string | null;
  orgTeamId?: string | null;
  orgTeamNotListedAt?: Date | string | null;
  activeTeamCount: number;
}): boolean {
  if (!params.organizationId) {
    return false;
  }
  if (params.orgTeamId) {
    return false;
  }
  if (params.orgTeamNotListedAt) {
    return false;
  }
  return params.activeTeamCount > 0;
}

export function formatOrgMemberNoTeamStatus(params: {
  orgTeamId?: string | null;
  orgTeamNotListedAt?: Date | string | null;
}): "has_team" | "not_listed" | "not_picked" {
  if (params.orgTeamId) {
    return "has_team";
  }
  if (params.orgTeamNotListedAt) {
    return "not_listed";
  }
  return "not_picked";
}
