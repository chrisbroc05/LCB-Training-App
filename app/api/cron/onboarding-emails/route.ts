import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  sendOnboardingEmail2,
  sendOnboardingEmail3,
} from "@/lib/notifications";

const DAY_MS = 24 * 60 * 60 * 1000;

function isAuthorized(request: Request) {
  const secret = process.env.ONBOARDING_CRON_SECRET;
  if (!secret) {
    return false;
  }

  const headerSecret = request.headers.get("x-cron-secret");
  const querySecret = new URL(request.url).searchParams.get("secret");
  return headerSecret === secret || querySecret === secret;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = Date.now();
  const day3Cutoff = new Date(now - 3 * DAY_MS);
  const day7Cutoff = new Date(now - 7 * DAY_MS);

  let day3Sent = 0;
  let day7Sent = 0;

  const day3Users = await prisma.user.findMany({
    where: {
      onboardingEmail2Sent: false,
      signupDate: { lte: day3Cutoff },
    },
    select: {
      id: true,
      email: true,
      name: true,
      membershipTier: true,
    },
    take: 200,
  });

  for (const user of day3Users) {
    const claim = await prisma.user.updateMany({
      where: { id: user.id, onboardingEmail2Sent: false },
      data: { onboardingEmail2Sent: true },
    });
    if (!claim.count) {
      continue;
    }

    try {
      await sendOnboardingEmail2({
        toEmail: user.email,
        displayName: user.name ?? user.email,
        membershipTier: user.membershipTier,
      });
      day3Sent += 1;
    } catch (error) {
      console.error("Failed to send onboarding day 3 email", error);
      await prisma.user.update({
        where: { id: user.id },
        data: { onboardingEmail2Sent: false },
      });
    }
  }

  const day7Users = await prisma.user.findMany({
    where: {
      onboardingEmail3Sent: false,
      signupDate: { lte: day7Cutoff },
    },
    select: {
      id: true,
      email: true,
      name: true,
      membershipTier: true,
    },
    take: 200,
  });

  for (const user of day7Users) {
    const claim = await prisma.user.updateMany({
      where: { id: user.id, onboardingEmail3Sent: false },
      data: { onboardingEmail3Sent: true },
    });
    if (!claim.count) {
      continue;
    }

    try {
      await sendOnboardingEmail3({
        toEmail: user.email,
        displayName: user.name ?? user.email,
        membershipTier: user.membershipTier,
      });
      day7Sent += 1;
    } catch (error) {
      console.error("Failed to send onboarding day 7 email", error);
      await prisma.user.update({
        where: { id: user.id },
        data: { onboardingEmail3Sent: false },
      });
    }
  }

  return NextResponse.json({
    success: true,
    day3Sent,
    day7Sent,
  });
}
