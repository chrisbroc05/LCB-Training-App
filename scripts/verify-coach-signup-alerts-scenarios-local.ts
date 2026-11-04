/**
 * Dev-only: create sign-up fixtures and print coach alert copy (no email/push).
 * Usage: npx tsx scripts/verify-coach-signup-alerts-scenarios-local.ts
 */
import "dotenv/config";
import { hash } from "bcryptjs";
import {
  buildCoachSignupAlertEmailContent,
  buildCoachSignupAlertSnapshotFromUserRow,
  buildCoachSignupPushMessage,
} from "../lib/coach-signup-alert-shared";
import { assertSafeLocalDevelopmentEnvironment } from "../lib/dev-environment-guard-shared";
import { getPublicAppUrl } from "../lib/email-layout";
import { LEGAL_DOCS_VERSION } from "../lib/legal-shared";
import { prisma } from "../lib/prisma";

const TAG = `signup-alert-verify-${Date.now()}`;

const signupUserSelect = {
  id: true,
  email: true,
  accountRole: true,
  accountHolderName: true,
  playerFirstName: true,
  playerLastName: true,
  playerAge: true,
  parentConsentName: true,
  parentConsentEmail: true,
  parentConsentConfirmedAt: true,
  organizationId: true,
  orgTeamId: true,
  pendingCheckoutLevel: true,
  membershipTier: true,
  createdAt: true,
  isTestAccount: true,
  orgTeam: { select: { name: true } },
  organization: {
    select: {
      name: true,
      active: true,
      trialStartsAt: true,
      trialEndsAt: true,
    },
  },
  linkedLeads: {
    select: { source: true, firstResourceSlug: true },
    orderBy: { createdAt: "asc" as const },
    take: 1,
  },
} as const;

async function loadSnapshot(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: signupUserSelect,
  });
  if (!user) {
    return null;
  }
  return buildCoachSignupAlertSnapshotFromUserRow(user);
}

async function printScenario(label: string, userId: string) {
  const snapshot = await loadSnapshot(userId);
  if (!snapshot) {
    throw new Error(`Missing snapshot for ${label}`);
  }
  const appBaseUrl = getPublicAppUrl();
  const email = buildCoachSignupAlertEmailContent(snapshot, appBaseUrl);
  const push = buildCoachSignupPushMessage(snapshot, appBaseUrl);
  console.log(`\n=== ${label} ===`);
  console.log("SUBJECT:", email.subject);
  console.log(email.text);
  console.log("PUSH:", push.title, "|", push.body);
}

async function attachOrg(userId: string, organizationId: string, orgTeamId?: string | null) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      organizationId,
      orgJoinedAt: new Date(),
      orgTeamId: orgTeamId ?? null,
      orgTeamChangedAt: orgTeamId ? new Date() : null,
    },
  });
}

async function main() {
  assertSafeLocalDevelopmentEnvironment();

  const org =
    (await prisma.organization.findFirst({
      where: { active: true, name: { contains: "NWT", mode: "insensitive" } },
    })) ??
    (await prisma.organization.findFirst({
      where: { active: true, trialEndsAt: { not: null } },
      orderBy: { name: "asc" },
    }));
  if (!org) {
    throw new Error("No active org with trial in DB. Run db:seed:dev.");
  }

  const team = await prisma.orgTeam.findFirst({
    where: { organizationId: org.id, active: true },
    orderBy: { sortOrder: "asc" },
  });

  const passwordHash = await hash("LcbDevSeed!2026", 12);
  const acceptedAt = new Date();

  const clubNoTeam = await prisma.user.create({
    data: {
      email: `${TAG}-club@dev.lcbtraining.test`,
      password: passwordHash,
      playerFirstName: "Jake",
      playerLastName: "Verify",
      name: "Jake Verify",
      accountRole: "PLAYER",
      playerAge: 14,
      membershipTier: "FREE",
      termsVersion: LEGAL_DOCS_VERSION,
      termsAcceptedAt: acceptedAt,
      acceptedByName: "Jake Verify",
      acceptedAsParent: false,
    },
    select: { id: true, email: true },
  });
  await attachOrg(clubNoTeam.id, org.id);

  const clubWithTeam = await prisma.user.create({
    data: {
      email: `${TAG}-club-team@dev.lcbtraining.test`,
      password: passwordHash,
      playerFirstName: "Sam",
      playerLastName: "Verify",
      name: "Sam Verify",
      accountRole: "PLAYER",
      playerAge: 15,
      membershipTier: "FREE",
      termsVersion: LEGAL_DOCS_VERSION,
      termsAcceptedAt: acceptedAt,
      acceptedByName: "Sam Verify",
      acceptedAsParent: false,
    },
    select: { id: true, email: true },
  });
  await attachOrg(clubWithTeam.id, org.id, team?.id ?? null);

  const freeLeadEmail = `${TAG}-free@dev.lcbtraining.test`;
  await prisma.lead.upsert({
    where: { email: freeLeadEmail },
    create: {
      email: freeLeadEmail,
      firstName: "Free",
      role: "PLAYER",
      source: "resources",
      firstResourceSlug: "player-iq-quiz",
    },
    update: {
      firstResourceSlug: "player-iq-quiz",
      source: "resources",
    },
  });
  const freeUser = await prisma.user.create({
    data: {
      email: freeLeadEmail,
      password: passwordHash,
      playerFirstName: "Free",
      playerLastName: "Verify",
      name: "Free Verify",
      accountRole: "PLAYER",
      playerAge: 16,
      membershipTier: "FREE",
      termsVersion: LEGAL_DOCS_VERSION,
      termsAcceptedAt: acceptedAt,
      acceptedByName: "Free Verify",
      acceptedAsParent: false,
    },
    select: { id: true, email: true },
  });
  await prisma.lead.update({
    where: { email: freeLeadEmail },
    data: { userId: freeUser.id },
  });

  const under13 = await prisma.user.create({
    data: {
      email: `${TAG}-u13@dev.lcbtraining.test`,
      password: passwordHash,
      playerFirstName: "Young",
      playerLastName: "Verify",
      name: "Young Verify",
      accountRole: "PARENT",
      accountHolderName: "Parent Verify",
      playerAge: 11,
      parentConsentName: "Parent Verify",
      parentConsentEmail: `${TAG}-u13@dev.lcbtraining.test`,
      parentConsentConfirmedAt: null,
      membershipTier: "FREE",
      termsVersion: LEGAL_DOCS_VERSION,
      termsAcceptedAt: acceptedAt,
      acceptedByName: "Parent Verify",
      acceptedAsParent: true,
    },
    select: { id: true, email: true },
  });

  await printScenario("Club join (no team)", clubNoTeam.id);
  await printScenario("Club join (with team if available)", clubWithTeam.id);
  await printScenario("Free + quiz lead", freeUser.id);
  await printScenario("Under-13 parent sign-up", under13.id);

  await prisma.user.deleteMany({
    where: {
      email: {
        in: [clubNoTeam.email, clubWithTeam.email, freeUser.email, under13.email],
      },
    },
  });

  console.log("\nverify-coach-signup-alerts-scenarios-local: ok");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
