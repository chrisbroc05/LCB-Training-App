import assert from "node:assert/strict";
import { parseBulkOrgTeamNameLines, planBulkOrgTeamUpserts } from "../lib/bulk-org-teams-shared";
import { prisma } from "../lib/prisma";

async function applyPlan(orgId: string, rawText: string) {
  const names = parseBulkOrgTeamNameLines(rawText);
  const existingTeams = await prisma.orgTeam.findMany({
    where: { organizationId: orgId },
    select: { id: true, name: true, sortOrder: true, active: true },
  });
  const plan = planBulkOrgTeamUpserts(names, existingTeams);

  await prisma.$transaction(async (tx) => {
    for (const action of plan.actions) {
      if (action.kind === "skip") {
        continue;
      }
      if (action.kind === "reactivate") {
        await tx.orgTeam.update({
          where: { id: action.teamId },
          data: { active: true, sortOrder: action.sortOrder, name: action.name },
        });
        continue;
      }
      await tx.orgTeam.create({
        data: {
          organizationId: orgId,
          name: action.name,
          sortOrder: action.sortOrder,
          active: true,
        },
      });
    }
  });

  return plan;
}

async function main() {
  const org = await prisma.organization.findFirst({
    where: { slug: { startsWith: "dev-" } },
    orderBy: { name: "asc" },
  });
  assert.ok(org, "Expected a dev-* organization in the local database.");

  const jv = await prisma.orgTeam.findFirst({
    where: { organizationId: org.id, name: { equals: "JV", mode: "insensitive" } },
  });
  if (jv) {
    await prisma.orgTeam.update({ where: { id: jv.id }, data: { active: false } });
  }

  const tag = `Bulk-${Date.now()}`;
  const nameA = `${tag}-A`;
  const nameB = `${tag}-B`;
  const text = [nameA, `  ${nameB}  `, "", nameB.toLowerCase(), jv ? "jv" : ""].filter(Boolean).join("\n");
  const plan = await applyPlan(org.id, text);
  assert.equal(plan.added, 2);
  assert.equal(plan.skipped, 0);
  assert.equal(plan.reactivated, jv ? 1 : 0);

  const created = await prisma.orgTeam.findMany({
    where: {
      organizationId: org.id,
      name: { in: [nameA, nameB] },
    },
    orderBy: { sortOrder: "asc" },
  });
  assert.equal(created.length, 2);
  assert.ok(created[0]!.sortOrder < created[1]!.sortOrder);

  await prisma.orgTeam.deleteMany({
    where: {
      organizationId: org.id,
      name: { in: [nameA, nameB] },
    },
  });
  if (jv) {
    await prisma.orgTeam.update({ where: { id: jv.id }, data: { active: true } });
  }

  console.log(`test-bulk-org-teams-local: ok (${org.slug})`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
