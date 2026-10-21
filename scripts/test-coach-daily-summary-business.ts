import assert from "node:assert/strict";
import {
  buildCoachDailySummarySubject,
  coachDailySummaryBusinessHasContent,
  formatCoachSummarySaleAmount,
} from "../lib/coach-daily-summary-business-shared";
import { buildCoachDailySummaryEmail } from "../lib/program-email-templates";

function testSubjectWithBusiness() {
  const subject = buildCoachDailySummarySubject({
    finished: 4,
    active: 6,
    notFinishedCount: 2,
    business: {
      sales: [
        {
          productLabel: "Speed Starter",
          amountCents: 1000,
          buyerName: "Alex",
          buyerEmail: "alex@example.com",
          occurredAt: new Date("2026-01-10T18:00:00Z"),
        },
      ],
      salesTotalCents: 1000,
      newLeads: [
        {
          name: "Sam",
          email: "sam@example.com",
          roleLabel: "Player (13+)",
          firstResourceLabel: "The Player IQ Quiz",
        },
        {
          name: "Pat",
          email: "pat@example.com",
          roleLabel: "Parent",
          firstResourceLabel: "Parent Guide",
        },
        {
          name: "Chris",
          email: "chris@example.com",
          roleLabel: "Coach",
          firstResourceLabel: "Pre-Game Warmup",
        },
      ],
      checkoutFollowUps: [],
      freeAccounts: [],
    },
  });

  assert.equal(subject, "LCB Today: 3 new leads, 1 sale ($10) | 2 players not finished");
}

function testSubjectWithoutBusiness() {
  const subject = buildCoachDailySummarySubject({
    finished: 3,
    active: 5,
    notFinishedCount: 1,
    business: null,
  });
  assert.equal(subject, "Program today: 3 of 5 finished");
}

function testBusinessHasContent() {
  assert.equal(coachDailySummaryBusinessHasContent(null), false);
  assert.equal(
    coachDailySummaryBusinessHasContent({
      sales: [],
      salesTotalCents: 0,
      newLeads: [],
      checkoutFollowUps: [],
      freeAccounts: [{ name: "A", accountKindLabel: "Player", email: "a@example.com" }],
    }),
    true,
  );
}

function testEmailIncludesBusinessSections() {
  const email = buildCoachDailySummaryEmail({
    finished: 0,
    active: 0,
    finishedNames: [],
    notFinished: [],
    goneQuietNames: [],
    newNotesCount: 0,
    recentNotes: [],
    gamesLoggedToday: [],
    videosWaiting: 0,
    unreadMessagesCount: 0,
    unconfirmedMinorNames: [],
    quizCompletedToday: 0,
    quizAverageScoreToday: 0,
    business: {
      sales: [],
      salesTotalCents: 0,
      newLeads: [
        {
          name: "Jordan",
          email: "jordan@example.com",
          roleLabel: "Player (13+)",
          firstResourceLabel: "The Player IQ Quiz",
        },
      ],
      checkoutFollowUps: [
        {
          name: "Taylor",
          email: "taylor@example.com",
          itemLabel: "4-Week Starter Bundle",
        },
      ],
      freeAccounts: [],
    },
  });

  assert.match(email.subject, /LCB Today: 1 new lead/);
  assert.match(email.html, /NEW LEADS TODAY/);
  assert.match(email.html, /WORTH A FOLLOW-UP/);
  assert.match(email.text, /WORTH A FOLLOW-UP \(checkout started but not finished\)/);
}

function testFormatSaleAmount() {
  assert.equal(formatCoachSummarySaleAmount(1000), "$10");
  assert.equal(formatCoachSummarySaleAmount(59900), "$599");
  assert.equal(formatCoachSummarySaleAmount(1099), "$10.99");
}

function run() {
  testSubjectWithBusiness();
  testSubjectWithoutBusiness();
  testBusinessHasContent();
  testEmailIncludesBusinessSections();
  testFormatSaleAmount();
  console.log("test-coach-daily-summary-business: ok");
}

run();
