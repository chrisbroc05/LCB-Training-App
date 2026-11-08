import { isPublicMembershipLevelsEnabled } from "../lib/membership-levels-shared";
import {
  buildPlayerEvaluationCtaContent,
  REPORT_RECOMMENDED_FIX_IT_SLUGS,
  REPORT_RECOMMENDED_PLAYBOOK_SLUG,
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
  assert(free.offers.length === 2, "FREE with None should have 2 offers (no auto Fix-It)");
  assert(free.urlLabel === "lcbtraining.com/resources", "FREE url label");
  assert(
    !free.offers.some((offer) => offer.title === "Fix-It Hitting Plans"),
    "FREE should not auto-add Fix-It plans when None is selected",
  );
  assert(
    !free.offers.some((offer) => offer.title.startsWith("Recommended for you:")),
    "FREE with None should hide Recommended for you column",
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

  const freeWithPlaybook = buildPlayerEvaluationCtaContent({
    firstName: "Jonathan",
    reviewTrack: "FREE_ONCE",
    recommendedFixItSlug: REPORT_RECOMMENDED_PLAYBOOK_SLUG,
  });
  assert(
    freeWithPlaybook.offers[0]!.title.includes("Playbook"),
    "Playbook recommendation should show Recommended for you column",
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

  const orgNoFounding = buildPlayerEvaluationCtaContent({
    firstName: "AJ",
    reviewTrack: "ORG_TRIAL_QUICK",
    orgName: "NWT",
    founding: {
      foundingOfferEnabled: false,
      foundingOfferDeadline: new Date("2026-01-15T23:59:59.000Z"),
      foundingOfferMonths: 12,
    },
  });
  assert(orgNoFounding.offers[1]!.title === "Want your next report?", "ORG trial title");
  assert(
    orgNoFounding.offers[1]!.body === "Keep going with a membership.",
    "ORG trial without founding offer uses short body",
  );
  assert(
    !orgNoFounding.offers[1]!.body.includes("trial runs"),
    "ORG trial next-report column should not repeat trial end",
  );

  const orgFounding = buildPlayerEvaluationCtaContent({
    firstName: "AJ",
    reviewTrack: "ORG_TRIAL_QUICK",
    orgName: "NWT",
    founding: {
      foundingOfferEnabled: true,
      foundingOfferDeadline: new Date("2026-01-15T18:00:00.000Z"),
      foundingOfferMonths: 12,
    },
    now: new Date("2026-01-01T12:00:00.000Z"),
  });
  assert(orgFounding.offers[1]!.title === "Want your next report?", "ORG founding title");
  assert(orgFounding.offers[1]!.body.includes("NWT families get Plus for $15/month"), "ORG founding body");
  assert(orgFounding.offers[1]!.body.includes("normally $20"), "ORG founding normal price");

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
