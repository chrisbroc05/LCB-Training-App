import {
  buildTeamFocusPreview,
  formatWeekStartChicagoInputValue,
  getWeekStartMondayChicago,
  parseWeekStartChicagoInput,
  pickOrgWeeklyFocusForMember,
  weekStartDatesMatch,
} from "../lib/org-weekly-focus-shared";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function chicagoWeekday(instant: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    weekday: "long",
  }).format(instant);
}

function testChicagoMondayWeek() {
  const sample = parseWeekStartChicagoInput("2026-10-23");
  assert(sample !== null, "parse week input");
  const monday = getWeekStartMondayChicago(sample!);
  assert(chicagoWeekday(monday) === "Monday", "week start must be Monday in Chicago");

  const thursday = parseWeekStartChicagoInput("2026-10-22");
  assert(thursday !== null, "parse another day");
  const mondayFromThursday = getWeekStartMondayChicago(thursday!);
  assert(
    weekStartDatesMatch(mondayFromThursday, monday),
    "days in the same week should resolve to the same Monday",
  );
  assert(
    formatWeekStartChicagoInputValue(monday) === formatWeekStartChicagoInputValue(mondayFromThursday),
    "week input labels should match",
  );
}

function testTeamOverridesClub() {
  const week = getWeekStartMondayChicago(new Date("2026-10-22T12:00:00Z"));
  const focuses = [
    {
      id: "club",
      orgTeamId: null,
      weekStartDate: week,
      title: "Whole club focus",
      notes: null,
      drillIds: [],
    },
    {
      id: "team",
      orgTeamId: "team-14u",
      weekStartDate: week,
      title: "14U focus",
      notes: null,
      drillIds: [],
    },
  ];
  const picked = pickOrgWeeklyFocusForMember(focuses, "team-14u", week);
  assert(picked?.title === "14U focus", "team focus should win");
  const fallback = pickOrgWeeklyFocusForMember(focuses, "team-other", week);
  assert(fallback?.title === "Whole club focus", "other team should get club focus");
}

function testTeamPreview() {
  const week = getWeekStartMondayChicago(new Date("2026-10-22T12:00:00Z"));
  const preview = buildTeamFocusPreview({
    teams: [
      { id: "a", name: "14U", active: true },
      { id: "b", name: "16U", active: true },
    ],
    focuses: [
      {
        id: "1",
        orgTeamId: null,
        weekStartDate: week,
        title: "Keep hands back",
        notes: null,
        drillIds: [],
      },
      {
        id: "2",
        orgTeamId: "a",
        weekStartDate: week,
        title: "Team cue",
        notes: null,
        drillIds: [],
      },
    ],
    weekStart: week,
  });
  assert(preview[0]?.focusTitle === "Team cue" && preview[0]?.source === "team", "14U preview");
  assert(preview[1]?.focusTitle === "Keep hands back" && preview[1]?.source === "club", "16U preview");
}

function loadDatabaseUrlFromEnvFile() {
  if (process.env.DATABASE_URL) {
    return;
  }
  try {
    const envPath = resolve(process.cwd(), ".env");
    const text = readFileSync(envPath, "utf8");
    for (const line of text.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }
      const match = trimmed.match(/^DATABASE_URL=(.*)$/);
      if (match) {
        process.env.DATABASE_URL = match[1].replace(/^["']|["']$/g, "");
        break;
      }
    }
  } catch {
    /* no local .env */
  }
}

async function testSaveAndReadBack() {
  loadDatabaseUrlFromEnvFile();
  if (!process.env.DATABASE_URL) {
    console.log("skip integration: DATABASE_URL not set");
    return;
  }

  const { prisma } = await import("../lib/prisma");

  const org = await prisma.organization.findFirst({
    where: { active: true },
    include: { teams: { where: { active: true }, take: 1 } },
  });
  if (!org) {
    console.log("skip integration: no active organization");
    return;
  }

  const team = org.teams[0] ?? null;
  const weekStart = getWeekStartMondayChicago();
  const weekInput = formatWeekStartChicagoInputValue(weekStart);
  const title = `Test focus ${Date.now()}`;

  await prisma.orgWeeklyFocus.deleteMany({
    where: {
      organizationId: org.id,
      weekStartDate: weekStart,
      title: { startsWith: "Test focus " },
    },
  });

  await prisma.orgWeeklyFocus.create({
    data: {
      organizationId: org.id,
      orgTeamId: null,
      weekStartDate: weekStart,
      title,
      notes: "integration test",
      drillIds: [],
    },
  });

  const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
  const rows = await prisma.orgWeeklyFocus.findMany({
    where: {
      organizationId: org.id,
      weekStartDate: { gte: weekStart, lt: weekEnd },
    },
  });
  const focusRows = rows.map((row) => ({
    id: row.id,
    orgTeamId: row.orgTeamId,
    weekStartDate: row.weekStartDate,
    title: row.title,
    notes: row.notes,
    drillIds: row.drillIds,
  }));

  const readBack = pickOrgWeeklyFocusForMember(focusRows, team?.id ?? null, weekStart);
  assert(readBack?.title === title, "member should read whole-club focus");

  const teamTitle = `${title} team`;
  if (team) {
    await prisma.orgWeeklyFocus.create({
      data: {
        organizationId: org.id,
        orgTeamId: team.id,
        weekStartDate: weekStart,
        title: teamTitle,
        notes: null,
        drillIds: [],
      },
    });
    const rowsWithTeam = await prisma.orgWeeklyFocus.findMany({
      where: {
        organizationId: org.id,
        weekStartDate: { gte: weekStart, lt: weekEnd },
      },
    });
    const teamRead = pickOrgWeeklyFocusForMember(
      rowsWithTeam.map((row) => ({
        id: row.id,
        orgTeamId: row.orgTeamId,
        weekStartDate: row.weekStartDate,
        title: row.title,
        notes: row.notes,
        drillIds: row.drillIds,
      })),
      team.id,
      weekStart,
    );
    assert(teamRead?.title === teamTitle, "team member should read team override");
  }

  assert(
    formatWeekStartChicagoInputValue(weekStart) === weekInput,
    "week input should match Chicago Monday label",
  );

  await prisma.$disconnect();
}

async function main() {
  testChicagoMondayWeek();
  testTeamOverridesClub();
  testTeamPreview();
  await testSaveAndReadBack();
  console.log("test-org-weekly-focus: ok");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
