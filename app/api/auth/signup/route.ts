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
import { sendNewMemberNotification } from "@/lib/notifications";
import { isTestAccountEmail } from "@/lib/test-account-shared";
import type { SignupRequestPayload } from "@/lib/signup-shared";
import {
  applyMatchingWaiverAcceptanceToUser,
  linkWaiverSignaturesToUser,
} from "@/lib/waiver-sign-server";

type SignupBody = SignupRequestPayload & {
  name?: string;
  selectedMembershipTier?: string;
  signupSource?: string;
};

export async function POST(request: Request) {
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

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long." },
        { status: 400 },
      );
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

    if (body.accountRole === "PARENT") {
      parentConsentName = accountHolderName;
      parentConsentEmail = email;
      parentConsentConfirmedAt = isUnder13PlayerAge(playerAge) ? null : new Date();
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

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }

    const hashedPassword = await hash(password, 12);
    const acceptedAt = new Date();
    const legacyName = combinePlayerName(playerFirstName, playerLastName);

    const createdUser = await prisma.user.create({
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
        mediaConsent: Boolean(body.legalAcceptance.mediaConsent),
        mediaConsentUpdatedAt: acceptedAt,
        isTestAccount: isTestAccountEmail(email),
      },
      select: {
        id: true,
        email: true,
        name: true,
        membershipTier: true,
      },
    });

    try {
      await linkWaiverSignaturesToUser(createdUser.id, email);
      await applyMatchingWaiverAcceptanceToUser(createdUser.id);
    } catch (error) {
      console.error("Failed to link waiver signatures to new user", error);
    }

    const shouldSendParentConsentEmail =
      parentConsentName &&
      parentConsentEmail &&
      (body.accountRole === "PLAYER" ? isMinorPlayerAge(playerAge) : isUnder13PlayerAge(playerAge));

    if (shouldSendParentConsentEmail) {
      try {
        const { finalizeMinorLegalAcceptanceSideEffects } = await import("@/lib/legal-server");
        await finalizeMinorLegalAcceptanceSideEffects(createdUser.id);
      } catch (error) {
        console.error("Failed to send parent consent email for new signup", error);
      }
    }

    try {
      await sendNewMemberNotification({
        userEmail: email,
        membershipTier: membershipTierForNotification,
      });
    } catch (error) {
      console.error("Failed to send new member notification", error);
    }

    try {
      const recipient = await loadUserMarketingRecipient(createdUser.id);
      if (recipient) {
        await sendMarketingEmail({
          recipient,
          type: "WELCOME",
        });
      }
    } catch (error) {
      console.error("Failed to send welcome email", error);
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Unable to create account right now." }, { status: 500 });
  }
}
