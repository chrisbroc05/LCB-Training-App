import { isPublicMembershipLevelsEnabled } from "../lib/membership-levels-shared";
import {
  buildPlayerEvaluationCtaContent,
  REPORT_RECOMMENDED_FIX_IT_SLUGS,
} from "../lib/player-evaluation-cta-shared";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function main() {
  const free = buildPlayerEvaluationCtaContent({
    firstName: "Jonathan",
    reviewTrack: "FREE_ONCE",
  });
  assert(free.offers.length === 3, "FREE should have 3 offers without Fix-It");
  assert(free.urlLabel === "lcbtraining.com/resources", "FREE url label");
  assert(
    free.offers.some((offer) => offer.title === "Fix-It Hitting Plans"),
    "FREE should include Fix-It plans column",
  );

  const freeWithFixIt = buildPlayerEvaluationCtaContent({
    firstName: "Jonathan",
    reviewTrack: "FREE_ONCE",
    recommendedFixItSlug: "fixit-stay-closed",
  });
  assert(freeWithFixIt.offers.length === 3, "FREE with Fix-It still max 3 columns");
  assert(
    freeWithFixIt.offers[0]!.title.startsWith("Recommended for you:"),
    "Fix-It should be first column",
  );
  assert(
    !freeWithFixIt.offers.some((offer) => offer.title === "Fix-It Hitting Plans"),
    "Skip generic Fix-It column when one is recommended",
  );

  const core = buildPlayerEvaluationCtaContent({
    firstName: "Jonathan",
    reviewTrack: "QUICK_SIX_WEEK",
    coreNextEligibleAt: new Date("2026-10-07T12:00:00.000Z"),
  });
  assert(core.offers[1]!.title === "Next report in 6 weeks", "CORE second column title");
  assert(core.offers[1]!.body.includes("Send your next swing on"), "CORE next eligible copy");
  const coreText = JSON.stringify(core);
  if (!isPublicMembershipLevelsEnabled()) {
    assert(!/plus/i.test(coreText), "CORE CTA must not name Plus when levels are hidden");
    assert(!/all-access/i.test(coreText), "CORE CTA must not name All-Access when levels are hidden");
  }

  const plusFixIt = buildPlayerEvaluationCtaContent({
    firstName: "Jonathan",
    reviewTrack: "FREE_ONCE",
    recommendedFixItSlug: "fixit-hit-the-brakes",
    membershipIncludesFixIt: true,
  });
  assert(
    plusFixIt.offers[0]!.body.includes("Included with your membership"),
    "PLUS Fix-It copy should mention membership",
  );

  for (const slug of REPORT_RECOMMENDED_FIX_IT_SLUGS) {
    const row = buildPlayerEvaluationCtaContent({
      firstName: "Test",
      reviewTrack: "FREE_ONCE",
      recommendedFixItSlug: slug,
    });
    assert(row.offers[0]!.title.includes("Recommended for you:"), `Fix-It slug ${slug}`);
  }

  console.log("test-player-evaluation-cta: all passed");
}

main();
