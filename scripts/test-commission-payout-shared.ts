import assert from "node:assert/strict";
import { buildCommissionMonthSummaries } from "../lib/commission-payout-shared";

const entries = [
  { commissionCents: 1000, paidAt: "2026-01-15T00:00:00.000Z" },
  { commissionCents: 800, paidAt: "2026-02-10T00:00:00.000Z" },
  { commissionCents: 500, paidAt: "2026-03-05T00:00:00.000Z" },
];

const janFebMar = buildCommissionMonthSummaries({
  monthKeys: ["2026-01", "2026-02", "2026-03"],
  entries,
  payouts: [],
});

assert.equal(janFebMar[0]?.monthCommissionCents, 1000);
assert.equal(janFebMar[0]?.amountDueCents, 0);
assert.equal(janFebMar[0]?.carriedForwardCents, 1000);

assert.equal(janFebMar[1]?.carriedInCents, 1000);
assert.equal(janFebMar[1]?.combinedCents, 1800);
assert.equal(janFebMar[1]?.amountDueCents, 0);
assert.equal(janFebMar[1]?.carriedForwardCents, 1800);

assert.equal(janFebMar[2]?.carriedInCents, 1800);
assert.equal(janFebMar[2]?.combinedCents, 2300);
assert.equal(janFebMar[2]?.amountDueCents, 2300);
assert.equal(janFebMar[2]?.carriedForwardCents, 0);

const withPayout = buildCommissionMonthSummaries({
  monthKeys: ["2026-03", "2026-04"],
  entries: [
    { commissionCents: 2300, paidAt: "2026-03-05T00:00:00.000Z" },
    { commissionCents: 500, paidAt: "2026-04-05T00:00:00.000Z" },
  ],
  payouts: [
    {
      monthKey: "2026-03",
      paid: true,
      amountCents: 2300,
      paidAt: "2026-03-31T00:00:00.000Z",
      method: "ACH",
      note: "ref-1",
    },
  ],
});

assert.equal(withPayout[0]?.paid, true);
assert.equal(withPayout[0]?.payoutMethod, "ACH");
assert.equal(withPayout[1]?.carriedInCents, 0);
assert.equal(withPayout[1]?.amountDueCents, 0);
assert.equal(withPayout[1]?.carriedForwardCents, 500);

const quarterEnd = buildCommissionMonthSummaries({
  monthKeys: ["2026-03"],
  entries: [{ commissionCents: 500, paidAt: "2026-03-05T00:00:00.000Z" }],
  payouts: [],
});
assert.equal(quarterEnd[0]?.isQuarterEnd, true);
assert.equal(quarterEnd[0]?.amountDueCents, 500);

const pendingMonth = buildCommissionMonthSummaries({
  monthKeys: ["2026-10"],
  entries: [
    { commissionCents: 150, paidAt: "2026-10-30T00:00:00.000Z", commissionFeePending: false },
    { commissionCents: 0, paidAt: "2026-10-31T00:00:00.000Z", commissionFeePending: true },
  ],
  payouts: [],
});
assert.equal(pendingMonth[0]?.monthCommissionCents, 150);

console.log("test-commission-payout-shared: ok");
