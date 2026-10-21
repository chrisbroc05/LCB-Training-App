import { NextResponse } from "next/server";
import { runLeadEmailScheduler } from "@/lib/lead-email-scheduler";
import { runMarketingEmailScheduler } from "@/lib/marketing-email-scheduler";

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

  try {
    const [result, leadResult] = await Promise.all([
      runMarketingEmailScheduler({ dryRun: false }),
      runLeadEmailScheduler(),
    ]);
    return NextResponse.json({
      success: true,
      sent: result.sent,
      skipped: result.skipped,
      errors: result.errors,
      leadSent: leadResult.sent,
      leadSkipped: leadResult.skipped,
      leadErrors: leadResult.errors,
      leadFollowUpBlockedMissingAddress: leadResult.blockedMissingAddress,
    });
  } catch (error) {
    console.error("Failed to run marketing email scheduler", error);
    return NextResponse.json({ error: "Unable to run marketing emails." }, { status: 500 });
  }
}
