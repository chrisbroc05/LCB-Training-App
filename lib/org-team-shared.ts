/** Org team selection helpers (client-safe). */

export function userHasInactiveOrgTeamAssignment(params: {
  organizationId: string | null | undefined;
  orgTeamId: string | null | undefined;
  orgTeamActive: boolean | null | undefined;
}): boolean {
  if (!params.organizationId || !params.orgTeamId) {
    return false;
  }
  return params.orgTeamActive === false;
}
