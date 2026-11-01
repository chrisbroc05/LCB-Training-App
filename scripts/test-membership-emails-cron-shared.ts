import assert from "node:assert/strict";
import {
  buildCommissionMonthlyReportEmailText,
  buildCommissionMonthlyReportSubject,
  formatCommissionReportMonthLabel,
} from "../lib/commission-monthly-report-shared";
import {
  buildAnnualRenewalReminderDedupeKey,
  buildAnnualRenewalReminderEmailText,
  buildCommissionReportDedupeKey,
  shouldRunCommissionMonthlyReportToday,
} from "../lib/membership-emails-cron-shared";

assert.equal(shouldRunCommissionMonthlyReportToday(new Date("2026-10-01T15:00:00.000Z")), true);
assert.equal(shouldRunCommissionMonthlyReportToday(new Date("2026-10-02T00:00:00.000Z")), false);
assert.equal(shouldRunCommissionMonthlyReportToday(new Date("2026-09-01T00:00:00.000Z")), true);

const periodEnd = new Date("2027-06-01T00:00:00.000Z");
assert.equal(
  buildAnnualRenewalReminderDedupeKey("user_1", periodEnd),
  "annual-renewal:user_1:2027-06-01",
);
assert.equal(buildCommissionReportDedupeKey("2026-09"), "commission-report:2026-09");

const renewal = buildAnnualRenewalReminderEmailText({
  displayName: "Pat",
  level: "CORE",
  renewalDateLabel: "June 1, 2027",
});
assert.match(renewal, /Core membership \(\$100\/yr\)/);

assert.equal(formatCommissionReportMonthLabel("2026-09"), "September 2026");
assert.equal(
  buildCommissionMonthlyReportSubject({ monthLabel: "September 2026", totalDueCents: 0 }),
  "Commission report: September 2026 - nothing due",
);
assert.equal(
  buildCommissionMonthlyReportSubject({ monthLabel: "September 2026", totalDueCents: 2500 }),
  "Commission report: September 2026 - $25.00 due by the 15th",
);

const reportBody = buildCommissionMonthlyReportEmailText({
  monthKey: "2026-09",
  monthLabel: "September 2026",
  orgLines: [
    {
      orgName: "Test Travelers",
      monthNetCents: 3000,
      carriedInCents: 500,
      payoutStatus: "$35.00 due now",
      amountDueCents: 3500,
      ledgerLines: [
        {
          playerLabel: "Alex T.",
          amountPaidCents: 2000,
          processingFeeCents: 88,
          netCents: 1912,
          commissionRate: 0.15,
          commissionCents: 287,
          commissionFeePending: false,
          isRefund: false,
        },
      ],
    },
  ],
  commissionsUrl: "http://localhost:3000/admin/business/commissions",
});
assert.match(reportBody, /Net commissions \(this month\): \$30\.00/);
assert.match(reportBody, /Carried balance in: \$5\.00/);
assert.match(reportBody, /admin\/business\/commissions/);
assert.match(reportBody, /paid \$20\.00, fee \$0\.88, net \$19\.12/);

console.log("test-membership-emails-cron-shared: ok");
