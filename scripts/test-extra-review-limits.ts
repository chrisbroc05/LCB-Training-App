import assert from "node:assert/strict";
import {
  chicagoMonthKey,
  chicagoWeekKey,
  extraReviewExpiresAt,
  EXTRA_REVIEW_MAX_PER_MONTH,
  EXTRA_REVIEW_MAX_PER_WEEK,
  EXTRA_REVIEW_USE_WINDOW_DAYS,
  formatPlusMonthlyReviewNextAvailableMessage,
  formatUnusedExtraReviewCreditsMessage,
  nextChicagoCalendarMonthStart,
} from "../lib/extra-review-shared";
import { formatMonthlyCoachingLimitMessage } from "../lib/coaching-submissions-shared";

assert.equal(EXTRA_REVIEW_MAX_PER_WEEK, 1);
assert.equal(EXTRA_REVIEW_MAX_PER_MONTH, 2);
assert.equal(EXTRA_REVIEW_USE_WINDOW_DAYS, 30);

const purchased = new Date("2026-06-15T18:00:00.000Z");
const expires = extraReviewExpiresAt(purchased);
assert.equal(
  Math.round((expires.getTime() - purchased.getTime()) / (24 * 60 * 60 * 1000)),
  30,
);

const weekA = chicagoWeekKey(new Date("2026-06-16T12:00:00.000Z"));
const weekB = chicagoWeekKey(new Date("2026-06-17T12:00:00.000Z"));
assert.equal(weekA, weekB, "same Chicago week");

const weekNext = chicagoWeekKey(new Date("2026-06-23T12:00:00.000Z"));
assert.notEqual(weekA, weekNext, "different Chicago week");

const monthJune = chicagoMonthKey(new Date("2026-06-20T12:00:00.000Z"));
const monthJuly = chicagoMonthKey(new Date("2026-07-01T12:00:00.000Z"));
assert.equal(monthJune, "2026-06");
assert.equal(monthJuly, "2026-07");

const novemberUsed = new Date("2026-11-15T18:00:00.000Z");
const nextAvailable = formatPlusMonthlyReviewNextAvailableMessage(novemberUsed);
assert.match(nextAvailable, /Dec 1, 2026/);
assert.doesNotMatch(nextAvailable, /Nov 30/);
assert.match(formatMonthlyCoachingLimitMessage(novemberUsed), /Dec 1, 2026/);

const decStart = nextChicagoCalendarMonthStart(novemberUsed);
assert.equal(decStart.getUTCMonth(), 11);
assert.equal(decStart.getUTCDate(), 1);

assert.match(
  formatUnusedExtraReviewCreditsMessage({
    count: 1,
    useByDate: new Date("2026-12-01T12:00:00.000Z"),
  }),
  /You have 1 extra review\. Use it by Dec 1, 2026\./,
);

console.log("test-extra-review-limits: ok");
