/**
 * Local smoke test: sign in and fetch member resource routes.
 * Usage: BASE_URL=http://localhost:3000 npx tsx scripts/smoke-member-resources-local.ts
 */

import "dotenv/config";
import assert from "node:assert/strict";
import { assertDevOnlyScript } from "../lib/dev-script-guard-shared";
import { prisma } from "../lib/prisma";

assertDevOnlyScript("scripts/smoke-member-resources-local.ts");

const BASE = (process.env.BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const PASSWORD = process.env.SMOKE_PASSWORD ?? "LcbDevSeed!2026";

type PathCheck = {
  path: string;
  assertOk: (text: string, status: number) => string | null;
};

function missingExpected(status: number, text: string, expected: string[]): string | null {
  if (status === 404) {
    return "HTTP 404";
  }
  if (expected.some((needle) => text.includes(needle))) {
    return null;
  }
  if (text.includes("This page could not be found")) {
    return "404 page";
  }
  return `missing expected content (${expected.join(" | ")})`;
}

function starterListOk(text: string, status: number): string | null {
  if (text.includes("Full workout programs unlock with an upgraded membership")) {
    return "starter upgrade wall";
  }
  return missingExpected(status, text, ["4-Week Starter Workouts"]);
}

function starterProgramOk(text: string, status: number): string | null {
  if (text.includes("Full workout programs unlock with an upgraded membership")) {
    return "starter upgrade wall";
  }
  return missingExpected(status, text, ["Back to", "- Week"]);
}

function memberGuidePdfOpenOk(text: string, status: number): string | null {
  if (text.includes("Full workout programs unlock with an upgraded membership")) {
    return "upgrade wall on guide open";
  }
  if (status !== 200) {
    return `HTTP ${status}`;
  }
  if (text.startsWith("%PDF")) {
    return null;
  }
  return "expected inline PDF body";
}

function orgTrialDashboardOk(text: string, status: number): string | null {
  return missingExpected(status, text, ["Trial", "focus"]);
}

function orgTrialPlaybookOk(text: string, status: number): string | null {
  if (text.includes("Standalone Purchase") && text.includes("$59")) {
    return "org trial sees paid playbook purchase page";
  }
  return missingExpected(status, text, [
    "four-chapter interactive guide",
    "Unlocks in January with Plus",
  ]);
}

function resourcesTabOk(text: string, status: number): string | null {
  return missingExpected(status, text, ["My Resources", "Everything I Use", "resources"]);
}

const ORG_TRIAL_PATHS: PathCheck[] = [
  { path: "/dashboard", assertOk: orgTrialDashboardOk },
  { path: "/dashboard/today", assertOk: orgTrialDashboardOk },
  { path: "/resources?tab=mine", assertOk: resourcesTabOk },
  { path: "/resources?tab=browse", assertOk: resourcesTabOk },
  { path: "/playbook", assertOk: orgTrialPlaybookOk },
  { path: "/workouts/starters", assertOk: starterListOk },
  { path: "/workouts/starters/strength", assertOk: starterProgramOk },
  { path: "/workouts/starters/speed_agility", assertOk: starterProgramOk },
  { path: "/workouts/starters/mobility", assertOk: starterProgramOk },
  { path: "/workouts/starters/strength/12-15/1", assertOk: starterProgramOk },
  {
    path: "/api/member/pdf/open?kind=guide&file=LCB_PreGame_Warmup.pdf",
    assertOk: memberGuidePdfOpenOk,
  },
  {
    path: "/api/member/pdf/open?kind=guide&file=LCB_Parent_Guide.pdf",
    assertOk: memberGuidePdfOpenOk,
  },
  {
    path: "/api/member/pdf/open?kind=guide&file=LCB_Nutrition_Guide.pdf",
    assertOk: memberGuidePdfOpenOk,
  },
  {
    path: "/api/member/pdf/open?kind=guide&file=LCB_Arm_Care_4Week_Starter.pdf",
    assertOk: memberGuidePdfOpenOk,
  },
  {
    path: "/api/member/pdf/open?kind=guide&file=LCB_Back_and_Arm_4Week_Starter.pdf",
    assertOk: memberGuidePdfOpenOk,
  },
];

const CORE_PATHS: PathCheck[] = ORG_TRIAL_PATHS.filter(
  (row) => !row.path.startsWith("/dashboard") && row.path !== "/playbook",
);

function mergeSetCookie(existing: Map<string, string>, header: string | null) {
  if (!header) {
    return;
  }
  for (const part of header.split(/,(?=\s*[^;]+=[^;]+)/)) {
    const pair = part.trim().split(";")[0];
    const eq = pair.indexOf("=");
    if (eq > 0) {
      existing.set(pair.slice(0, eq), pair.slice(eq + 1));
    }
  }
}

function cookieHeader(jar: Map<string, string>) {
  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
}

async function signIn(email: string): Promise<Map<string, string>> {
  const jar = new Map<string, string>();
  const csrfRes = await fetch(`${BASE}/api/auth/csrf`);
  mergeSetCookie(jar, csrfRes.headers.get("set-cookie"));
  const csrfJson = (await csrfRes.json()) as { csrfToken?: string };
  assert.ok(csrfJson.csrfToken, "csrf token");

  const body = new URLSearchParams({
    csrfToken: csrfJson.csrfToken,
    email,
    password: PASSWORD,
    callbackUrl: `${BASE}/dashboard`,
    json: "true",
  });

  const loginRes = await fetch(`${BASE}/api/auth/callback/credentials`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: cookieHeader(jar),
    },
    body,
    redirect: "manual",
  });
  mergeSetCookie(jar, loginRes.headers.get("set-cookie"));

  const sessionRes = await fetch(`${BASE}/api/auth/session`, {
    headers: { Cookie: cookieHeader(jar) },
  });
  const session = (await sessionRes.json()) as { user?: { email?: string } };
  assert.equal(
    session.user?.email?.toLowerCase(),
    email.toLowerCase(),
    `session not established for ${email}`,
  );

  return jar;
}

async function fetchPath(jar: Map<string, string>, path: string) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Cookie: cookieHeader(jar) },
    redirect: "follow",
  });
  return { status: res.status, text: await res.text() };
}

async function smokePaths(label: string, email: string, checks: PathCheck[]) {
  console.log(`\n== ${label} (${email}) ==`);
  const jar = await signIn(email);
  const issues: string[] = [];

  for (const check of checks) {
    const { status, text } = await fetchPath(jar, check.path);
    const problem = check.assertOk(text, status);
    if (problem) {
      issues.push(`${label} ${check.path}: ${problem}`);
      console.log(`FAIL ${check.path} (${status}) ${problem}`);
    } else {
      console.log(`ok   ${check.path} (${status})`);
    }
  }

  return issues;
}

async function checkJoinTeamPickerGates() {
  console.log("\n== Join / banner team picker gates ==");
  const issues: string[] = [];

  const noTeamOrg = await prisma.organization.findFirst({
    where: { slug: "dev-club-paid", active: true },
    select: { id: true },
  });
  assert.ok(noTeamOrg, "dev-club-paid org missing from seed");

  const teamCount = await prisma.orgTeam.count({
    where: { organizationId: noTeamOrg.id, active: true },
  });
  assert.equal(teamCount, 0, "dev-club-paid should have zero active teams");

  await prisma.orgCode.upsert({
    where: { code: "NOTEAMS" },
    create: {
      organizationId: noTeamOrg.id,
      code: "NOTEAMS",
      label: "Smoke no-team org",
      active: true,
    },
    update: { active: true, organizationId: noTeamOrg.id },
  });

  const noTeamsHtml = await (await fetch(`${BASE}/join/NOTEAMS`)).text();
  if (noTeamsHtml.includes("Pick your team")) {
    issues.push("join/NOTEAMS shows team picker but org has no teams");
  } else {
    console.log("ok   join/NOTEAMS (no team picker)");
  }

  const joinJar = await signIn("player-core@dev.lcbtraining.test");
  const devClubHtml = await fetchPath(joinJar, "/join/DEVCLUB");
  if (!devClubHtml.text.includes("Pick your team")) {
    issues.push("join/DEVCLUB missing team picker for org with teams (signed-in user)");
  } else {
    console.log("ok   join/DEVCLUB (team picker shown)");
  }

  const trialOrg = await prisma.organization.findFirst({
    where: { slug: "dev-test-club" },
    select: { id: true },
  });
  assert.ok(trialOrg);
  const activeTeams = await prisma.orgTeam.count({
    where: { organizationId: trialOrg.id, active: true },
  });
  assert.ok(activeTeams > 0, "dev-test-club should have teams for banner gate");

  const bannerUser = await prisma.user.findUnique({
    where: { email: "player-org-trial@dev.lcbtraining.test" },
    select: { orgTeamId: true, organizationId: true },
  });
  if (bannerUser?.organizationId === trialOrg.id && bannerUser.orgTeamId) {
    const homeHtml = await fetchPath(await signIn("player-org-trial@dev.lcbtraining.test"), "/dashboard");
    if (homeHtml.text.includes("Pick your team")) {
      issues.push("Pick your team banner shown when user already has orgTeamId");
    } else {
      console.log("ok   dashboard org-trial with team (no pick-team banner)");
    }
  }

  return issues;
}

async function main() {
  const allIssues: string[] = [];
  allIssues.push(
    ...(await smokePaths(
      "ORG_TRIAL",
      "player-org-trial@dev.lcbtraining.test",
      ORG_TRIAL_PATHS,
    )),
  );
  allIssues.push(
    ...(await smokePaths("CORE", "player-core@dev.lcbtraining.test", CORE_PATHS)),
  );
  allIssues.push(...(await checkJoinTeamPickerGates()));

  if (allIssues.length) {
    console.error("\nSMOKE FAILURES:");
    for (const issue of allIssues) {
      console.error(` - ${issue}`);
    }
    process.exit(1);
  }
  console.log("\nsmoke-member-resources-local: all passed");
}

void main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
