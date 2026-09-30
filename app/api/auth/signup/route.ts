import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { isDatabaseTier, type DatabaseTier } from "@/lib/membership";
import { loadUserMarketingRecipient } from "@/lib/marketing-email-data";
import { sendMarketingEmail } from "@/lib/marketing-email-send";
import { validateAcceptedByName, LEGAL_DOCS_VERSION } from "@/lib/legal-shared";
import { sendNewMemberNotification } from "@/lib/notifications";

type SignupBody = {
  name?: string;
  email?: string;
  password?: string;
  selectedMembershipTier?: string;
  signupSource?: string;
  legalAcceptance?: {
    acceptedByName?: string;
    acceptedAsParent?: boolean;
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
