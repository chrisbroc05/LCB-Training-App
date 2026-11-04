/**
 * Local dry-run for coach sign-up alert copy (no email/push sent).
 * Usage: npx tsx scripts/verify-coach-signup-alerts-local.ts [userId...]
 */
import "dotenv/config";
import {
  buildCoachSignupAlertEmailContent,
  buildCoachSignupAlertSnapshotFromUserRow,
  buildCoachSignupPushMessage,
} from "../lib/coach-signup-alert-shared";
import { getPublicAppUrl } from "../lib/email-layout";
import { prisma } from "../lib/prisma";

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

async function main() {
  const ids = process.argv.slice(2);
  if (ids.length === 0) {
    console.error("Pass one or more user IDs from recent sign-ups.");
    process.exit(1);
  }

  const appBaseUrl = getPublicAppUrl();

  for (const userId of ids) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: signupUserSelect,
    });
    if (!user) {
      console.error(`No user: ${userId}`);
      continue;
    }
    const snapshot = buildCoachSignupAlertSnapshotFromUserRow(user);
    const email = buildCoachSignupAlertEmailContent(snapshot, appBaseUrl);
    const push = buildCoachSignupPushMessage(snapshot, appBaseUrl);
    console.log("\n---", userId, "---");
    console.log("EMAIL SUBJECT:", email.subject);
    console.log(email.text);
    console.log("PUSH:", push.title, "|", push.body, "|", push.url);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
