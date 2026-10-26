import "dotenv/config";
import { hash } from "bcryptjs";
import { assertSafeDevDatabaseTarget } from "../lib/dev-environment-guard-shared";
import { hittingVideos } from "../lib/drill-library-videos";
import { LEGAL_ADULT_AGE, LEGAL_DOCS_VERSION } from "../lib/legal-shared";

const DEV_SEED_PASSWORD = "LcbDevSeed!2026";
const DEV_EMAIL_DOMAIN = "dev.lcbtraining.test";

function requireEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required to seed the dev database.`);
  }
  return value;
}

function devEmail(local: string) {
  return `${local}@${DEV_EMAIL_DOMAIN}`;
}

function extractVimeoId(url: string) {
  const match = url.match(/video\/(\d+)/);
  return match?.[1] ?? null;
}

async function main() {
  const databaseUrl = requireEnv("DATABASE_URL");
  assertSafeDevDatabaseTarget(databaseUrl, "db:seed:dev");

  if (process.env.NODE_ENV === "production") {
    throw new Error("db:seed:dev cannot run with NODE_ENV=production.");
  }

  const { prisma } = await import("../lib/prisma");

  const adminEmail = (process.env.ADMIN_EMAIL ?? "coach@dev.lcbtraining.test").trim().toLowerCase();
  const passwordHash = await hash(DEV_SEED_PASSWORD, 12);
  const now = new Date();
  const levelExpires = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

  function devLegalAccepted(acceptedByName: string, playerAge: number | null) {
    const isMinor = playerAge != null && playerAge < LEGAL_ADULT_AGE;
    return {
      termsVersion: LEGAL_DOCS_VERSION,
      termsAcceptedAt: now,
      acceptedByName,
      acceptedAsParent: isMinor,
      playerAge,
      mediaConsent: true,
      mediaConsentUpdatedAt: now,
    };
  }

  function devLegalAwaitingParentConsent(playerAge: number) {
    return {
      playerAge,
      parentConsentEmail: devEmail("parent-consent"),
      parentConsentName: "Dev Parent",
      parentConsentConfirmedAt: null,
      parentConsentEmailSentAt: now,
      termsVersion: null,
      termsAcceptedAt: null,
      acceptedByName: null,
      acceptedAsParent: false,
      mediaConsent: false,
      mediaConsentUpdatedAt: null,
    };
  }

  console.log("Clearing prior dev seed data...");
  await prisma.resourcePurchase.deleteMany({ where: { email: { endsWith: `@${DEV_EMAIL_DOMAIN}` } } });
  const devLeads = await prisma.lead.findMany({
    where: { email: { endsWith: `@${DEV_EMAIL_DOMAIN}` } },
    select: { id: true },
  });
  if (devLeads.length) {
    await prisma.quizAttempt.deleteMany({
      where: { leadId: { in: devLeads.map((row) => row.id) } },
    });
  }
  await prisma.lead.deleteMany({ where: { email: { endsWith: `@${DEV_EMAIL_DOMAIN}` } } });
  await prisma.swingAnalysisSubmission.deleteMany({
    where: { userEmail: { endsWith: `@${DEV_EMAIL_DOMAIN}` } },
  });
  await prisma.mentalGameSubmission.deleteMany({
    where: { userEmail: { endsWith: `@${DEV_EMAIL_DOMAIN}` } },
  });
  await prisma.orgWeeklyFocus.deleteMany({});
  await prisma.orgCode.deleteMany({});
  await prisma.orgTeam.deleteMany({});
  await prisma.organization.deleteMany({ where: { slug: { startsWith: "dev-" } } });
  await prisma.programEnrollment.deleteMany({});
  await prisma.user.deleteMany({
    where: {
      OR: [
        { email: { endsWith: `@${DEV_EMAIL_DOMAIN}` } },
        { email: adminEmail },
        { isTestAccount: true },
      ],
    },
  });

  console.log("Creating drill catalog starter rows...");
  const starterIds = hittingVideos
    .slice(0, 12)
    .map((video) => extractVimeoId(video.url))
    .filter((id): id is string => Boolean(id));

  for (const vimeoId of starterIds) {
    await prisma.drillLibraryCatalog.upsert({
      where: { vimeoId },
      create: { vimeoId, isStarterDrill: true },
      update: { isStarterDrill: true },
    });
  }

  async function createPlayer(params: {
    local: string;
    name: string;
    membershipTier: "FREE" | "BASIC" | "TWELVE_WEEK";
    membershipLevel?: "CORE" | "PLUS" | "ALL_ACCESS" | null;
    playbookLegacyAccess?: boolean;
    playerAge?: number;
    parentPending?: boolean;
  }) {
    const email = devEmail(params.local);
    const playerAge = params.playerAge ?? 16;
    const legal = params.parentPending
      ? devLegalAwaitingParentConsent(playerAge)
      : devLegalAccepted(params.name, playerAge);

    return prisma.user.create({
      data: {
        email,
        password: passwordHash,
        name: params.name,
        playerFirstName: params.name.split(" ")[0],
        playerLastName: params.name.split(" ").slice(1).join(" ") || "Player",
        membershipTier: params.membershipTier,
        membershipLevel: params.membershipLevel ?? null,
        membershipLevelExpiresAt: params.membershipLevel ? levelExpires : null,
        playbookLegacyAccess: params.playbookLegacyAccess ?? false,
        isTestAccount: true,
        emailVerified: now,
        ...legal,
      },
    });
  }

  console.log("Creating users...");
  await prisma.user.create({
    data: {
      email: adminEmail,
      password: passwordHash,
      name: "Dev Admin",
      membershipTier: "TWELVE_WEEK",
      membershipLevel: "ALL_ACCESS",
      membershipLevelExpiresAt: levelExpires,
      isTestAccount: true,
      emailVerified: now,
      ...devLegalAccepted("Dev Admin", null),
    },
  });

  const freeUser = await createPlayer({
    local: "player-free",
    name: "Free Player",
    membershipTier: "FREE",
  });
  await createPlayer({
    local: "player-playbook",
    name: "Playbook Player",
    membershipTier: "BASIC",
  });
  await createPlayer({
    local: "player-playbook-legacy",
    name: "Legacy Playbook Player",
    membershipTier: "BASIC",
    playbookLegacyAccess: true,
  });
  await createPlayer({
    local: "player-core",
    name: "Core Player",
    membershipTier: "BASIC",
    membershipLevel: "CORE",
  });
  await createPlayer({
    local: "player-plus",
    name: "Plus Player",
    membershipTier: "BASIC",
    membershipLevel: "PLUS",
  });
  const allAccessUser = await createPlayer({
    local: "player-allaccess",
    name: "All Access Player",
    membershipTier: "BASIC",
    membershipLevel: "ALL_ACCESS",
  });
  const twelveWeekUser = await createPlayer({
    local: "player-twelve-week",
    name: "Twelve Week Player",
    membershipTier: "TWELVE_WEEK",
    membershipLevel: "ALL_ACCESS",
  });
  await createPlayer({
    local: "player-minor-consent",
    name: "Minor Pending Consent",
    membershipTier: "FREE",
    playerAge: 14,
    parentPending: true,
  });
  const orgTrialUser = await createPlayer({
    local: "player-org-trial",
    name: "Org Trial Player",
    membershipTier: "FREE",
  });

  const programStart = new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000);
  await prisma.programEnrollment.create({
    data: {
      userId: twelveWeekUser.id,
      status: "ACTIVE",
      planMode: "FIXED_12_WEEK",
      startDate: programStart,
      ageGroup: "AGE_12_15",
      focusAreas: ["hitting", "fielding"],
      equipment: ["dumbbells"],
      seasonMode: "IN_SEASON",
      onboardingCompletedAt: programStart,
    },
  });

  console.log("Creating organizations...");
  const trialOrg = await prisma.organization.create({
    data: {
      name: "Test Club",
      slug: "dev-test-club",
      billingMode: "FAMILY_PAY",
      coveredLevel: "CORE",
      trialStartsAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      trialEndsAt: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
      trialLockedCopy: "Your club trial ends soon. Upgrade to keep team features.",
    },
  });

  const clubPaidOrg = await prisma.organization.create({
    data: {
      name: "Dev Club Paid",
      slug: "dev-club-paid",
      billingMode: "CLUB_PAY",
      coveredLevel: "PLUS",
    },
  });

  const varsity = await prisma.orgTeam.create({
    data: { organizationId: trialOrg.id, name: "Varsity", sortOrder: 1 },
  });
  await prisma.orgTeam.create({
    data: { organizationId: trialOrg.id, name: "JV", sortOrder: 2 },
  });

  await prisma.orgCode.create({
    data: { organizationId: trialOrg.id, code: "DEVCLUB", label: "Test Club join code" },
  });

  const weekStart = new Date(now);
  weekStart.setUTCHours(0, 0, 0, 0);
  weekStart.setUTCDate(weekStart.getUTCDate() - weekStart.getUTCDay());

  await prisma.orgWeeklyFocus.create({
    data: {
      organizationId: trialOrg.id,
      orgTeamId: varsity.id,
      weekStartDate: weekStart,
      title: "Stay through contact",
      notes: "Dev seed weekly focus.",
      drillIds: starterIds.slice(0, 3),
    },
  });

  await prisma.user.update({
    where: { id: allAccessUser.id },
    data: {
      organizationId: trialOrg.id,
      orgTeamId: varsity.id,
      orgJoinedAt: now,
    },
  });

  await prisma.user.update({
    where: { id: orgTrialUser.id },
    data: {
      organizationId: trialOrg.id,
      orgTeamId: varsity.id,
      orgJoinedAt: now,
    },
  });

  await prisma.user.update({
    where: { id: freeUser.id },
    data: { organizationId: clubPaidOrg.id, orgJoinedAt: now },
  });

  console.log("Creating submissions and reports...");
  await prisma.swingAnalysisSubmission.create({
    data: {
      userId: freeUser.id,
      userEmail: freeUser.email,
      playerName: "Free Player",
      pitchType: "BP",
      handedness: "Right-handed hitter",
      whereWasThis: "Practice",
      videoCategory: "fielding",
      lookAtFocus: "Footwork",
      notes: "Dev seed pending video review.",
      submittedVideo: "r2:dev/seed/pending-fielding.mp4",
      responsePreference: "VIDEO_RESPONSE",
      status: "PENDING",
      reviewTrack: "FREE_ONCE",
    },
  });

  await prisma.swingAnalysisSubmission.create({
    data: {
      userId: allAccessUser.id,
      userEmail: allAccessUser.email,
      playerName: "All Access Player",
      pitchType: "Live",
      handedness: "Right-handed hitter",
      whereWasThis: "Game",
      videoCategory: "hitting",
      lookAtFocus: "Load",
      notes: "Dev seed pending written report.",
      submittedVideo: "r2:dev/seed/pending-written.mp4",
      responsePreference: "WRITTEN_RESPONSE",
      status: "PENDING",
      reviewTrack: "IN_DEPTH_MONTHLY",
    },
  });

  await prisma.swingAnalysisSubmission.create({
    data: {
      userId: twelveWeekUser.id,
      userEmail: twelveWeekUser.email,
      playerName: "Twelve Week Player",
      pitchType: "BP",
      handedness: "Left-handed hitter",
      whereWasThis: "Cage",
      videoCategory: "hitting",
      lookAtFocus: "Contact",
      notes: "Dev seed responded submission.",
      submittedVideo: "r2:dev/seed/responded.mp4",
      responsePreference: "VIDEO_RESPONSE",
      status: "COMPLETED",
      reviewTrack: "PROGRAM",
      responseText: "Nice swing path. Keep working the top-hand drill this week.",
      respondedAt: now,
    },
  });

  await prisma.swingAnalysisSubmission.create({
    data: {
      userId: twelveWeekUser.id,
      userEmail: twelveWeekUser.email,
      playerName: "Twelve Week Player",
      pitchType: "BP",
      handedness: "Left-handed hitter",
      whereWasThis: "Practice",
      videoCategory: "hitting",
      lookAtFocus: "Timing",
      notes: "Dev seed sent written report.",
      submittedVideo: "r2:dev/seed/sent-report.mp4",
      responsePreference: "WRITTEN_RESPONSE",
      status: "COMPLETED",
      reviewTrack: "PROGRAM",
      reportStrengths: ["Good posture", "Stable base"],
      reportAreasToImprove: ["Early rotation"],
      reportRecommendedDrillLines: ["Half bat drill 3x/week"],
      reportLibraryDrillIds: starterIds.slice(0, 2),
      reportNoteFromCoach: "Strong progress. Stay on the half bat drill.",
      respondedAt: now,
    },
  });

  await prisma.mentalGameSubmission.create({
    data: {
      userId: allAccessUser.id,
      userEmail: allAccessUser.email,
      playerName: "All Access Player",
      playerAge: "16",
      topic: "CONFIDENCE",
      message: "Dev seed mental submission.",
      videoPath: "r2:dev/seed/mental.mp4",
      responsePreference: "WRITTEN_RESPONSE",
      status: "PENDING",
    },
  });

  console.log("Creating leads, quiz attempts, purchases...");
  const lead = await prisma.lead.create({
    data: {
      email: devEmail("lead-parent"),
      firstName: "Dev",
      role: "PARENT",
      source: "dev-seed",
      firstResourceSlug: "pregame-warmup",
    },
  });

  await prisma.quizAttempt.create({
    data: {
      leadId: lead.id,
      role: "PARENT",
      optionOrder: { order: [1, 2, 3] },
      answers: { q1: "a" },
      score: 12,
      level: "Developing",
      completedAt: now,
    },
  });

  await prisma.resourcePurchase.create({
    data: {
      email: devEmail("player-free"),
      userId: freeUser.id,
      resourceSlug: "starter-strength",
      stripeSessionId: `dev_seed_strength_${Date.now()}`,
      amountCents: 1000,
    },
  });

  console.log("");
  console.log("Dev seed complete.");
  console.log(`Admin login: ${adminEmail} / ${DEV_SEED_PASSWORD}`);
  console.log(`Test players: *@${DEV_EMAIL_DOMAIN} / ${DEV_SEED_PASSWORD}`);
  console.log("Org join code: DEVCLUB (Test Club trial org)");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    const { prisma } = await import("../lib/prisma");
    await prisma.$disconnect();
  });
