import { NextResponse } from "next/server";
import { resolveCronDryRunNow } from "@/lib/cron-dry-run-at-shared";
import { getChicagoDateTimeParts } from "@/lib/program-email-chicago";
import { getActiveScheduleWindows } from "@/lib/program-schedule-windows";
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

  const url = new URL(request.url);
  const dryRun = url.searchParams.get("dryRun") === "1";
  const skipSideEffects = dryRun || url.searchParams.get("skipSideEffects") === "1";

  try {
    let now: Date;
    let simulatedAtIso: string;
    let atQueryApplied: boolean;
    try {
      ({ now, simulatedAtIso, atQueryApplied } = resolveCronDryRunNow({
        dryRun,
        atParam: dryRun ? url.searchParams.get("at") : null,
      }));
    } catch (parseError) {
      return NextResponse.json(
        { error: parseError instanceof Error ? parseError.message : "Invalid at parameter." },
        { status: 400 },
      );
    }

    const chicagoParts = getChicagoDateTimeParts(now);
    const programSchedulePreview = dryRun
      ? {
          dateKey: chicagoParts.dateKey,
          chicagoHour: chicagoParts.hour,
          isSaturday: chicagoParts.isSaturday,
          isSunday: chicagoParts.isSunday,
          activeWindowIds: getActiveScheduleWindows(chicagoParts.hour, {
            isSaturday: chicagoParts.isSaturday,
            isSunday: chicagoParts.isSunday,
          }).map((window) => window.id),
        }
      : undefined;

    const marketingResult = await runMarketingEmailScheduler({ dryRun, now });
    const leadResult = await runLeadEmailScheduler({ now, dryRun });
    const renewalResult = await runAnnualRenewalReminderEmails({ now, dryRun });
    const commissionResult = shouldRunCommissionMonthlyReportToday(now)
      ? await runCommissionMonthlyReportEmail({ now, dryRun })
      : { sent: 0, skipped: 0, errors: [] as string[], preview: null };
    const parentDeferralFallback = skipSideEffects
      ? { scanned: 0, applied: 0 }
      : await runDeferredParentAccountSignupFallbacks(now, false);
    const feeRetry = skipSideEffects
      ? { scanned: 0, resolved: 0, stillPending: 0, errors: [] as string[] }
      : await runPendingCommissionFeeResolution({ limit: 25 }).catch((error) => {
          console.error("Commission fee retry batch failed", error);
          return {
            scanned: 0,
            resolved: 0,
            stillPending: 0,
            errors: [error instanceof Error ? error.message : String(error)],
          };
        });

    return NextResponse.json({
      success: true,
      dryRun,
      skipSideEffects,
      ...(dryRun
        ? {
            simulatedAt: simulatedAtIso,
            atQueryApplied,
            programSchedulePreview,
          }
        : {}),
      marketing: {
        sent: marketingResult.sent,
        skipped: marketingResult.skipped,
        errors: marketingResult.errors,
        previews: marketingResult.previews,
      },
      lead: {
        sent: leadResult.sent,
        skipped: leadResult.skipped,
        errors: leadResult.errors,
        followUpBlockedMissingAddress: leadResult.blockedMissingAddress,
        previews: leadResult.previews,
      },
      annualRenewal: {
        sent: renewalResult.sent,
        skipped: renewalResult.skipped,
        previews: renewalResult.previews ?? [],
      },
      commissionMonthlyReport: commissionResult,
      parentDeferralFallbackScanned: parentDeferralFallback.scanned,
      parentDeferralFallbackApplied: parentDeferralFallback.applied,
      commissionFeeRetryScanned: feeRetry.scanned,
      commissionFeeRetryResolved: feeRetry.resolved,
      commissionFeeRetryStillPending: feeRetry.stillPending,
      commissionFeeRetryErrors: feeRetry.errors ?? [],
    });
  } catch (error) {
    console.error("Failed to run onboarding email cron", error);
    return NextResponse.json({ error: "Unable to run onboarding email cron." }, { status: 500 });
  }
}
