import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { combinePlayerName, namesMatch } from "@/lib/account-shared";
import { isDatabaseTier, type DatabaseTier } from "@/lib/membership";
import { loadUserMarketingRecipient } from "@/lib/marketing-email-data";
import { sendMarketingEmail } from "@/lib/marketing-email-send";
import {
  isMinorPlayerAge,
  isUnder13PlayerAge,
  LEGAL_DOCS_VERSION,
  parseLegalPlayerAge,
  validateAcceptedByName,
  validateParentConsentEmail,
} from "@/lib/legal-shared";
import {
  hasPaidSignupCheckoutIntent,
  PARENT_CONSENT_METHOD_ACCOUNT_SIGNUP,
} from "@/lib/parent-consent-shared";
import {
  applyMinorLegalParentConsentRecords,
  sendMinorLegalParentConsentEmailIfNeeded,
} from "@/lib/legal-server";
import { isTestAccountEmail } from "@/lib/test-account-shared";
import type { SignupRequestPayload } from "@/lib/signup-shared";
import { parseMembershipBillingInterval } from "@/lib/membership-billing-shared";
import { isMembershipLevelKey } from "@/lib/membership-levels-shared";
import {
  shouldSendFreeWelcomeAtSignup,
} from "@/lib/membership-welcome-email-shared";
import { isCompanyMailingAddressConfigured } from "@/lib/marketing-email-guard-server";
import { isOnOrAfterMarketingEmailsStart } from "@/lib/marketing-emails-start-shared";
import { joinOrganizationForUser } from "@/lib/org-server";
import {
  isPrismaTransientError,
  isPrismaUniqueViolation,
  withPrismaRetryOnce,
} from "@/lib/prisma-retry-shared";
import { validatePassword } from "@/lib/password-shared";
import { runSignupBackgroundTask } from "@/lib/signup-post-create-server";
import {
  applyMatchingWaiverAcceptanceToUser,
  linkWaiverSignaturesToUser,
} from "@/lib/waiver-sign-server";

type SignupBody = SignupRequestPayload & {
  name?: string;
  selectedMembershipTier?: string;
  signupSource?: string;
  orgJoinCode?: string;
  pendingMembershipLevel?: string;
  pendingMembershipBillingInterval?: string;
};

async function rollbackFailedSignupUser(userId: string) {
  try {
    await prisma.user.delete({ where: { id: userId } });
  } catch (rollbackError) {
    console.error(`Signup rollback failed for userId=${userId}`, rollbackError);
  }
}

export async function POST(request: Request) {
  let createdUserId: string | null = null;

  try {
    const body = (await request.json()) as SignupBody;
    const email = body.email?.trim().toLowerCase();
    const password = body.password ?? "";
    const selectedMembershipTier = body.selectedMembershipTier?.toUpperCase() ?? "FREE";
    const membershipTierForNotification: DatabaseTier = isDatabaseTier(selectedMembershipTier)
      ? selectedMembershipTier
      : "FREE";

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 },
      );
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      return NextResponse.json({ error: passwordError }, { status: 400 });
    }

    if (body.accountRole !== "PLAYER" && body.accountRole !== "PARENT") {
      return NextResponse.json({ error: "Choose who is signing up." }, { status: 400 });
    }

    const playerFirstName = body.playerFirstName?.trim() ?? "";
    const playerLastName = body.playerLastName?.trim() ?? "";
    if (!playerFirstName || !playerLastName) {
      return NextResponse.json(
        { error: "Enter the player's first and last name." },
        { status: 400 },
      );
    }

    const playerAge = parseLegalPlayerAge(body.legalAcceptance?.playerAge);
    if (playerAge == null) {
      return NextResponse.json({ error: "Enter a valid player age (5-25)." }, { status: 400 });
    }

    const accountHolderName = body.accountHolderName?.trim() ?? "";
    if (body.accountRole === "PARENT") {
      const holderNameError = validateAcceptedByName(accountHolderName);
      if (holderNameError) {
        return NextResponse.json({ error: "Enter your full name (first and last)." }, { status: 400 });
      }
    }

    const acceptedByName = body.legalAcceptance?.acceptedByName?.trim() ?? "";
    const nameError = validateAcceptedByName(acceptedByName);
    if (nameError) {
      return NextResponse.json({ error: nameError }, { status: 400 });
    }

    if (body.accountRole === "PARENT" && !namesMatch(acceptedByName, accountHolderName)) {
      return NextResponse.json(
        { error: "The agreement name must match your full name." },
        { status: 400 },
      );
    }

    if (typeof body.legalAcceptance?.acceptedAsParent !== "boolean") {
      return NextResponse.json(
        { error: "Select whether you are the player or the parent or guardian." },
        { status: 400 },
      );
    }

    let parentConsentName: string | null = null;
    let parentConsentEmail: string | null = null;
    let parentConsentConfirmedAt: Date | null = null;
    let parentConsentMethod: string | null = null;

    const pendingLevelRawEarly = body.pendingMembershipLevel?.trim().toUpperCase() ?? "";
    const pendingCheckoutLevelEarly = isMembershipLevelKey(pendingLevelRawEarly)
      ? pendingLevelRawEarly
      : undefined;
    const signupSourceEarly = body.signupSource?.trim() ?? "";
    const paidCheckoutIntent = hasPaidSignupCheckoutIntent({
      pendingCheckoutLevel: pendingCheckoutLevelEarly,
      signupSource: signupSourceEarly,
      selectedMembershipTier: membershipTierForNotification,
    });

    if (body.accountRole === "PARENT") {
      parentConsentName = accountHolderName;
      parentConsentEmail = email;
      if (isUnder13PlayerAge(playerAge)) {
        parentConsentConfirmedAt = null;
        if (paidCheckoutIntent) {
          parentConsentMethod = PARENT_CONSENT_METHOD_ACCOUNT_SIGNUP;
        }
      } else {
        parentConsentConfirmedAt = new Date();
        parentConsentMethod = PARENT_CONSENT_METHOD_ACCOUNT_SIGNUP;
      }
    } else if (isMinorPlayerAge(playerAge)) {
      parentConsentName = body.legalAcceptance?.parentConsentName?.trim() ?? "";
      parentConsentEmail = body.legalAcceptance?.parentConsentEmail?.trim().toLowerCase() ?? "";

      const parentNameError = validateAcceptedByName(parentConsentName);
      if (parentNameError) {
        return NextResponse.json(
          { error: "Enter the parent or guardian full name (at least first and last)." },
          { status: 400 },
        );
      }

      const parentEmailError = validateParentConsentEmail(parentConsentEmail);
      if (parentEmailError) {
        return NextResponse.json({ error: parentEmailError }, { status: 400 });
      }

      if (!body.legalAcceptance?.acceptedAsParent) {
        return NextResponse.json(
          { error: "A parent or guardian must agree for players under 18." },
          { status: 400 },
        );
      }
    }

    const existingUser = await withPrismaRetryOnce(() =>
      prisma.user.findUnique({
        where: { email },
        select: { id: true },
      }),
    );

    if (existingUser) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }

    const hashedPassword = await hash(password, 12);
    const acceptedAt = new Date();
    const legacyName = combinePlayerName(playerFirstName, playerLastName);
    const pendingLevelRaw = body.pendingMembershipLevel?.trim().toUpperCase() ?? "";
    const pendingCheckoutLevel = isMembershipLevelKey(pendingLevelRaw) ? pendingLevelRaw : undefined;
    const pendingCheckoutBillingInterval = pendingCheckoutLevel
      ? parseMembershipBillingInterval(body.pendingMembershipBillingInterval)
      : undefined;
    const signupSource = body.signupSource?.trim() ?? "";

    const createdUser = await withPrismaRetryOnce(() =>
      prisma.user.create({
        data: {
          name: legacyName,
          accountRole: body.accountRole,
          accountHolderName: body.accountRole === "PARENT" ? accountHolderName : null,
          playerFirstName,
          playerLastName,
          email,
          password: hashedPassword,
          membershipTier: "FREE",
          signupDate: new Date(),
          termsVersion: LEGAL_DOCS_VERSION,
          termsAcceptedAt: acceptedAt,
          acceptedByName,
          acceptedAsParent: body.legalAcceptance.acceptedAsParent,
          playerAge,
          parentConsentName,
          parentConsentEmail,
          parentConsentConfirmedAt,
          parentConsentMethod,
          mediaConsent: Boolean(body.legalAcceptance.mediaConsent),
          mediaConsentUpdatedAt: acceptedAt,
          isTestAccount: isTestAccountEmail(email),
          ...(pendingCheckoutLevel
            ? {
                pendingCheckoutLevel,
                pendingCheckoutBillingInterval,
                pendingCheckoutAt: new Date(),
              }
            : {}),
        },
        select: {
          id: true,
          email: true,
          name: true,
          membershipTier: true,
        },
      }),
    );

    createdUserId = createdUser.id;

    await linkWaiverSignaturesToUser(createdUser.id, email);
    await applyMatchingWaiverAcceptanceToUser(createdUser.id);

    const orgJoinCode = body.orgJoinCode?.trim();
    if (orgJoinCode) {
      await joinOrganizationForUser({ userId: createdUser.id, codeRaw: orgJoinCode });
    }

    const needsMinorParentConsentRecords =
      parentConsentName &&
      parentConsentEmail &&
      (body.accountRole === "PLAYER" ? isMinorPlayerAge(playerAge) : isUnder13PlayerAge(playerAge));

    if (needsMinorParentConsentRecords) {
      await applyMinorLegalParentConsentRecords(createdUser.id);
    }

    const userId = createdUser.id;


    const skipParentConsentEmailAtSignup =
      body.accountRole === "PARENT" && paidCheckoutIntent && isUnder13PlayerAge(playerAge);

    if (needsMinorParentConsentRecords && !skipParentConsentEmailAtSignup) {
      runSignupBackgroundTask(userId, "sendMinorLegalParentConsentEmailIfNeeded", async () => {
        await sendMinorLegalParentConsentEmailIfNeeded(userId);
      });
    }

    runSignupBackgroundTask(userId, "coachSignupAlerts", async () => {
      const { linkLeadToUserByEmail } = await import("@/lib/leads-server");
      await linkLeadToUserByEmail(userId, email);
      const { handleCoachSignupAlerts } = await import("@/lib/coach-signup-alert-server");
      await handleCoachSignupAlerts({ userId, signupSource });
    });

    if (
      isCompanyMailingAddressConfigured() &&
      isOnOrAfterMarketingEmailsStart(new Date()) &&
      shouldSendFreeWelcomeAtSignup({
        pendingCheckoutLevel,
        signupSource,
        selectedMembershipTier: membershipTierForNotification,
      })
    ) {
      runSignupBackgroundTask(userId, "sendWelcomeEmail", async () => {
        const recipient = await loadUserMarketingRecipient(userId);
        if (recipient) {
          await sendMarketingEmail({
            recipient,
            type: "WELCOME",
          });
        }
      });
    }

    createdUserId = null;
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Signup failed", error);
    if (createdUserId) {
      await rollbackFailedSignupUser(createdUserId);
    }
    if (isPrismaUniqueViolation(error)) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 },
      );
    }
    if (isPrismaTransientError(error)) {
      return NextResponse.json(
        { error: "The database is waking up. Please try again in a few seconds." },
        { status: 503 },
      );
    }
    return NextResponse.json({ error: "Unable to create account right now." }, { status: 500 });
  }
}
