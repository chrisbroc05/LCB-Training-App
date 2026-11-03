export type BulkOrgTeamExisting = {
  id: string;
  name: string;
  sortOrder: number;
  active: boolean;
};

export type BulkOrgTeamPlanAction =
  | { kind: "skip"; name: string }
  | { kind: "reactivate"; name: string; teamId: string; sortOrder: number }
  | { kind: "create"; name: string; sortOrder: number };

export type BulkOrgTeamPlan = {
  actions: BulkOrgTeamPlanAction[];
  added: number;
  reactivated: number;
  skipped: number;
};

export function parseBulkOrgTeamNameLines(text: string): string[] {
  const names: string[] = [];
  const seenLower = new Set<string>();

  for (const line of text.split(/\r?\n/)) {
    const name = line.trim();
    if (!name) {
      continue;
    }

    const key = name.toLowerCase();
    if (seenLower.has(key)) {
      continue;
    }

    seenLower.add(key);
    names.push(name);
  }

  return names;
}

export function planBulkOrgTeamUpserts(
  names: string[],
  existingTeams: BulkOrgTeamExisting[],
): BulkOrgTeamPlan {
  const byLowerName = new Map(existingTeams.map((team) => [team.name.toLowerCase(), { ...team }]));
  const maxSortOrder = existingTeams.reduce((max, team) => Math.max(max, team.sortOrder), -1);
  let nextSortOrder = maxSortOrder + 1;

  const actions: BulkOrgTeamPlanAction[] = [];
  let added = 0;
  let reactivated = 0;
  let skipped = 0;

  for (const name of names) {
    const existing = byLowerName.get(name.toLowerCase());
    if (existing?.active) {
      actions.push({ kind: "skip", name });
      skipped += 1;
      continue;
    }

    if (existing && !existing.active) {
      const sortOrder = nextSortOrder;
      nextSortOrder += 1;
      actions.push({ kind: "reactivate", name, teamId: existing.id, sortOrder });
      reactivated += 1;
      existing.active = true;
      existing.sortOrder = sortOrder;
      continue;
    }

    const sortOrder = nextSortOrder;
    nextSortOrder += 1;
    actions.push({ kind: "create", name, sortOrder });
    added += 1;
    byLowerName.set(name.toLowerCase(), {
      id: `pending-${name}`,
      name,
      sortOrder,
      active: true,
    });
  }

  return { actions, added, reactivated, skipped };
}

export function formatBulkOrgTeamResultSummary(plan: Pick<BulkOrgTeamPlan, "added" | "reactivated" | "skipped">) {
  return `Added ${plan.added}, reactivated ${plan.reactivated}, skipped ${plan.skipped} (already active)`;
}
