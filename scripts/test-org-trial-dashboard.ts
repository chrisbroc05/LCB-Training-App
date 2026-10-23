import { chicagoEndOfCalendarDay, chicagoStartOfCalendarDay } from "../lib/org-trial-dates-shared";
import {
  formatOrgTrialCountdownLabel,
  getOrgTrialDaysRemainingChicago,
  isOrgTrialFinalFortnight,
  resolveOrgTrialDashboardCardVisibility,
} from "../lib/org-trial-dashboard-shared";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function testDaysRemaining() {
  const today = chicagoStartOfCalendarDay(2026, 10, 23);
  const trialEnd = chicagoEndOfCalendarDay(2026, 11, 30);
  const days = getOrgTrialDaysRemainingChicago(trialEnd, today);
  assert(days !== null && days > 14, "Oct 23 to Nov 30 should be more than 14 days");

  const nearEnd = chicagoEndOfCalendarDay(2026, 11, 5);
  const daysNear = getOrgTrialDaysRemainingChicago(nearEnd, today);
  assert(daysNear === 13, `expected 13 days remaining, got ${daysNear}`);
  assert(isOrgTrialFinalFortnight(nearEnd, today), "should be in final fortnight");
}

function testDismissAndCountdown() {
  const trialEnd = chicagoEndOfCalendarDay(2026, 11, 2);
  const midTrial = chicagoStartOfCalendarDay(2026, 10, 15);
  const dismissed = resolveOrgTrialDashboardCardVisibility({
    dismissedAt: midTrial,
    trialEndsAt: trialEnd,
    now: midTrial,
  });
  assert(!dismissed.show, "dismissed card hidden outside final 14 days");

  const finalWeek = chicagoStartOfCalendarDay(2026, 10, 28);
  const countdown = resolveOrgTrialDashboardCardVisibility({
    dismissedAt: midTrial,
    trialEndsAt: trialEnd,
    now: finalWeek,
  });
  assert(countdown.show && countdown.mode === "countdown", "countdown card shows even if dismissed");

  const label = formatOrgTrialCountdownLabel(trialEnd, finalWeek);
  assert(label !== null && label.includes("days"), "countdown label should mention days");
}

function main() {
  testDaysRemaining();
  testDismissAndCountdown();
  console.log("test-org-trial-dashboard: ok");
}

main();
