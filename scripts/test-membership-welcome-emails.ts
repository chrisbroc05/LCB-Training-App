import assert from "node:assert/strict";
import { coachNewProgramPlayerPushTitle } from "../lib/coach-push-shared";
import {
  buildMembershipLevelWelcomeEmail,
  buildTwelveWeekProgramWelcomeEmail,
  formatCheckoutLevelLabelForCoachNotification,
  formatSignupCheckoutLabelForCoachNotification,
  membershipWelcomeDedupeKey,
  shouldSendFreeWelcomeAtSignup,
  shouldSendMembershipLevelWelcomeOnSubscriptionChange,
  twelveWeekProgramWelcomeDedupeKey,
} from "../lib/membership-welcome-email-shared";
import { getPublicAppUrl } from "../lib/public-app-url";

function main() {
  assert.equal(shouldSendFreeWelcomeAtSignup({}), true);
  assert.equal(shouldSendFreeWelcomeAtSignup({ pendingCheckoutLevel: "CORE" }), false);
  assert.equal(shouldSendFreeWelcomeAtSignup({ signupSource: "program" }), false);
  assert.equal(shouldSendFreeWelcomeAtSignup({ signupSource: "playbook" }), false);
  assert.equal(
    shouldSendFreeWelcomeAtSignup({ selectedMembershipTier: "TWELVE_WEEK" }),
    false,
  );
  assert.equal(shouldSendFreeWelcomeAtSignup({ selectedMembershipTier: "BASIC" }), false);

  assert.equal(formatCheckoutLevelLabelForCoachNotification(null), "Free");
  assert.equal(formatCheckoutLevelLabelForCoachNotification("CORE"), "Core");

  assert.equal(formatSignupCheckoutLabelForCoachNotification({}), "Free");
  assert.equal(
    formatSignupCheckoutLabelForCoachNotification({ signupSource: "program" }),
    "12-Week Program",
  );
  assert.equal(
    formatSignupCheckoutLabelForCoachNotification({ signupSource: "playbook" }),
    "Playbook",
  );
  assert.equal(
    formatSignupCheckoutLabelForCoachNotification({ pendingCheckoutLevel: "PLUS" }),
    "Plus",
  );

  const appUrl = getPublicAppUrl();
  const submitPath = "/coaching-submissions";

  const core = buildMembershipLevelWelcomeEmail("CORE", { firstName: "Alex" });
  assert.equal(core.subject, "Welcome to Core");
  assert.match(core.text, /Hey Alex,/);
  assert.match(core.text, /\$10\/mo/);
  assert.match(core.text, new RegExp(`${appUrl}${submitPath.replace("/", "\\/")}`));
  assert.match(core.html, /Send your swing/);
  assert.doesNotMatch(core.text, /Unsubscribe from marketing/i);
  assert.doesNotMatch(core.html, /marketing\/unsubscribe/i);

  assert.equal(
    shouldSendMembershipLevelWelcomeOnSubscriptionChange({
      hadAccessBefore: false,
      previousLevel: null,
      activeLevel: "CORE",
    }),
    true,
  );
  assert.equal(
    shouldSendMembershipLevelWelcomeOnSubscriptionChange({
      hadAccessBefore: true,
      previousLevel: "CORE",
      activeLevel: "PLUS",
    }),
    true,
  );
  assert.equal(
    shouldSendMembershipLevelWelcomeOnSubscriptionChange({
      hadAccessBefore: true,
      previousLevel: "PLUS",
      activeLevel: "ALL_ACCESS",
    }),
    true,
  );
  assert.equal(
    shouldSendMembershipLevelWelcomeOnSubscriptionChange({
      hadAccessBefore: true,
      previousLevel: "PLUS",
      activeLevel: "CORE",
    }),
    false,
  );
  assert.equal(
    shouldSendMembershipLevelWelcomeOnSubscriptionChange({
      hadAccessBefore: true,
      previousLevel: "ALL_ACCESS",
      activeLevel: "PLUS",
    }),
    false,
  );
  assert.equal(
    shouldSendMembershipLevelWelcomeOnSubscriptionChange({
      hadAccessBefore: true,
      previousLevel: "CORE",
      activeLevel: "CORE",
    }),
    false,
  );

  const plus = buildMembershipLevelWelcomeEmail("PLUS", { firstName: "Sam" });
  assert.equal(plus.subject, "Welcome to Plus");
  assert.match(plus.text, /Welcome to Plus/);
  assert.match(plus.text, /\$20\/mo/);

  const aa = buildMembershipLevelWelcomeEmail("ALL_ACCESS", {
    firstName: "Jordan",
    showAllAccessSetupLink: true,
  });
  assert.equal(aa.subject, "Welcome to All-Access");
  assert.match(aa.text, /calendly\.com\/chrisbroc05\/talk-with-coach-broc/);
  assert.match(aa.text, /\$249\/mo/);
  assert.match(aa.text, new RegExp(`${appUrl}/program/start`));

  const aaDone = buildMembershipLevelWelcomeEmail("ALL_ACCESS", {
    firstName: "Jordan",
    showAllAccessSetupLink: false,
  });
  assert.doesNotMatch(aaDone.text, /Finish setup/);

  assert.equal(
    membershipWelcomeDedupeKey("user_1", "CORE"),
    "user_1:MEMBERSHIP_LEVEL_WELCOME:CORE",
  );

  const twelveWeek = buildTwelveWeekProgramWelcomeEmail({
    firstName: "Casey",
    showSetupLink: true,
  });
  assert.equal(twelveWeek.subject, "Welcome to the 12-Week Program");
  assert.match(twelveWeek.text, /Week 12, we'll compare your swing to Week 1/);
  assert.match(twelveWeek.text, /calendly\.com\/chrisbroc05\/talk-with-coach-broc/);
  assert.match(twelveWeek.text, new RegExp(`${appUrl}/program/start`));
  assert.doesNotMatch(twelveWeek.text, /Unsubscribe from marketing/i);

  assert.equal(
    twelveWeekProgramWelcomeDedupeKey("user_tw"),
    "user_tw:TWELVE_WEEK_PROGRAM_WELCOME",
  );

  assert.equal(
    coachNewProgramPlayerPushTitle({
      playerName: "Pat",
      playerEmail: "pat@example.com",
      allAccess: true,
    }),
    "New All-Access player: Pat",
  );
  assert.equal(
    coachNewProgramPlayerPushTitle({
      playerName: "",
      playerEmail: "pat@example.com",
      allAccess: false,
    }),
    "New 12-week player: pat@example.com",
  );

  console.log("test-membership-welcome-emails: all passed");
}

main();
