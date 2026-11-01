import { NextResponse } from "next/server";
import { runLeadEmailScheduler } from "@/lib/lead-email-scheduler";
import { runMarketingEmailScheduler } from "@/lib/marketing-email-scheduler";
import { runDeferredParentAccountSignupFallbacks } from "@/lib/legal-server";
import {
  runAnnualRenewalReminderEmails,
  runCommissionMonthlyReportEmail,
  shouldRunCommissionMonthlyReportToday,
} from "@/lib/membership-emails-cron-server";
import { runPendingCommissionFeeResolution } from "@/lib/membership-payment-stripe-fee-server";

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
    const now = new Date();
    const [result, leadResult, renewalResult, commissionResult, parentDeferralFallback, feeRetry] =
      await Promise.all([
      runMarketingEmailScheduler({ dryRun: false }),
      runLeadEmailScheduler(),
      runAnnualRenewalReminderEmails({ now }),
      shouldRunCommissionMonthlyReportToday(now)
        ? runCommissionMonthlyReportEmail({ now })
        : Promise.resolve({ sent: 0, skipped: 0, errors: [] as string[] }),
      runDeferredParentAccountSignupFallbacks(now),
      runPendingCommissionFeeResolution({ limit: 25 }).catch((error) => {
        console.error("Commission fee retry batch failed", error);
        return {
          scanned: 0,
          resolved: 0,
          stillPending: 0,
          errors: [error instanceof Error ? error.message : String(error)],
        };
      }),
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
      annualRenewalSent: renewalResult.sent,
      annualRenewalSkipped: renewalResult.skipped,
      commissionReportSent: commissionResult.sent,
      commissionReportSkipped: commissionResult.skipped,
      commissionReportErrors: commissionResult.errors,
      parentDeferralFallbackScanned: parentDeferralFallback.scanned,
      parentDeferralFallbackApplied: parentDeferralFallback.applied,
      commissionFeeRetryScanned: feeRetry.scanned,
      commissionFeeRetryResolved: feeRetry.resolved,
      commissionFeeRetryStillPending: feeRetry.stillPending,
      commissionFeeRetryErrors: feeRetry.errors ?? [],
    });
  } catch (error) {
    console.error("Failed to run marketing email scheduler", error);
    return NextResponse.json({ error: "Unable to run marketing emails." }, { status: 500 });
  }
}
