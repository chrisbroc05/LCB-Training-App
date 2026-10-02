import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { isDatabaseTier, type DatabaseTier } from "@/lib/membership";
import { loadUserMarketingRecipient } from "@/lib/marketing-email-data";
import { sendMarketingEmail } from "@/lib/marketing-email-send";
import {
  isMinorPlayerAge,
  LEGAL_DOCS_VERSION,
  parseLegalPlayerAge,
  validateAcceptedByName,
  validateParentConsentEmail,
} from "@/lib/legal-shared";
import { sendNewMemberNotification } from "@/lib/notifications";
import {
  applyMatchingWaiverAcceptanceToUser,
  linkWaiverSignaturesToUser,
} from "@/lib/waiver-sign-server";

type SignupBody = {
  name?: string;
  email?: string;
  password?: string;
  selectedMembershipTier?: string;
  signupSource?: string;
  legalAcceptance?: {
    acceptedByName?: string;
    acceptedAsParent?: boolean;
    playerAge?: number | string;
    parentConsentName?: string | null;
    parentConsentEmail?: string | null;
    mediaConsent?: boolean;
  };
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SignupBody;
    const name = body.name?.trim() ?? "";
    const email = body.email?.trim().toLowerCase();
    const password = body.password ?? "";
    const selectedMembershipTier = body.selectedMembershipTier?.toUpperCase() ?? "FREE";
    const signupSource = body.signupSource?.toLowerCase() ?? "standard";
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

    const playerAge = parseLegalPlayerAge(body.legalAcceptance?.playerAge);
    if (playerAge == null) {
      return NextResponse.json({ error: "Enter a valid player age (5-25)." }, { status: 400 });
    }

    const acceptedByName = body.legalAcceptance?.acceptedByName?.trim() ?? "";
    const nameError = validateAcceptedByName(acceptedByName);
    if (nameError) {
      return NextResponse.json({ error: nameError }, { status: 400 });
    }

    if (typeof body.legalAcceptance?.acceptedAsParent !== "boolean") {
      return NextResponse.json(
        { error: "Select whether you are the player or the parent or guardian." },
        { status: 400 },
      );
    }

    let parentConsentName: string | null = null;
    let parentConsentEmail: string | null = null;

    if (isMinorPlayerAge(playerAge)) {
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
    } else if (body.legalAcceptance.acceptedAsParent) {
      parentConsentName = null;
      parentConsentEmail = null;
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
    const createdUser = await prisma.user.create({
      data: {
        name: name || null,
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
        mediaConsent: Boolean(body.legalAcceptance.mediaConsent),
        mediaConsentUpdatedAt: acceptedAt,
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

    if (isMinorPlayerAge(playerAge) && parentConsentName && parentConsentEmail) {
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
