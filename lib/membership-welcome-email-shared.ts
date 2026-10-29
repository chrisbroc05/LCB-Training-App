import {
  buildEmailButton,
  buildMemberEmailHtml,
  buildEmailFooterText,
  escapeHtml,
  getPublicAppUrl,
} from "@/lib/email-layout";
import type { DatabaseTier } from "@/lib/membership";
import {
  formatMembershipLevelLabel,
  MEMBERSHIP_LEVELS,
  type MembershipLevelKey,
} from "@/lib/membership-levels-shared";
import { isMembershipLevelUpgrade } from "@/lib/membership-subscription-shared";

const PAID_MEMBERSHIP_LEVELS: MembershipLevelKey[] = ["CORE", "PLUS", "ALL_ACCESS"];

export function isPaidMembershipLevelKey(
  level: string | null | undefined,
): level is MembershipLevelKey {
  return level != null && (PAID_MEMBERSHIP_LEVELS as readonly string[]).includes(level);
}

/**
 * Level welcome emails are transactional (sent via sendNotificationEmail, member footer only).
 * MarketingEmailLog rows for MEMBERSHIP_LEVEL_WELCOME are dedupe records only - never use sendMarketingEmail.
 */
export function shouldSendMembershipLevelWelcomeOnSubscriptionChange(params: {
  hadAccessBefore: boolean;
  previousLevel: MembershipLevelKey | null;
  activeLevel: MembershipLevelKey;
}): boolean {
  if (!isPaidMembershipLevelKey(params.activeLevel)) {
    return false;
  }
  if (!params.hadAccessBefore) {
    return true;
  }
  if (params.previousLevel === params.activeLevel) {
    return false;
  }
  const prev = params.previousLevel;
  if (!isPaidMembershipLevelKey(prev)) {
    return true;
  }
  return isMembershipLevelUpgrade(prev, params.activeLevel);
}

const ALL_ACCESS_KICKOFF_URL = "https://calendly.com/chrisbroc05/talk-with-coach-broc";

export function shouldSendFreeWelcomeAtSignup(params: {
  pendingCheckoutLevel?: MembershipLevelKey | null;
  signupSource?: string | null;
  selectedMembershipTier?: DatabaseTier | null;
}): boolean {
  if (params.pendingCheckoutLevel) {
    return false;
  }
  const source = params.signupSource?.trim().toLowerCase() ?? "";
  if (source === "program" || source === "playbook") {
    return false;
  }
  const tier = params.selectedMembershipTier;
  if (tier === "TWELVE_WEEK" || tier === "BASIC") {
    return false;
  }
  return true;
}

export function twelveWeekProgramWelcomeMarketingType(): "TWELVE_WEEK_PROGRAM_WELCOME" {
  return "TWELVE_WEEK_PROGRAM_WELCOME";
}

export function twelveWeekProgramWelcomeDedupeKey(userId: string) {
  return `${userId}:TWELVE_WEEK_PROGRAM_WELCOME`;
}

export function membershipWelcomeMarketingType(): "MEMBERSHIP_LEVEL_WELCOME" {
  return "MEMBERSHIP_LEVEL_WELCOME";
}

export function membershipWelcomeDedupeKey(userId: string, level: MembershipLevelKey) {
  return `${userId}:MEMBERSHIP_LEVEL_WELCOME:${level}`;
}

function paragraph(text: string) {
  return `<p style="margin:0 0 16px 0; font-family:Arial, Helvetica, sans-serif; font-size:15px; line-height:1.7; color:#0A1628;">${text}</p>`;
}

function bulletList(items: string[]) {
  const lis = items.map((item) => `<li style="margin:0 0 8px 0;">${item}</li>`).join("");
  return `<ul style="margin:0 0 16px 0; padding-left:20px; font-family:Arial, Helvetica, sans-serif; font-size:15px; line-height:1.7; color:#0A1628;">${lis}</ul>`;
}

function wrapMemberEmail(params: { subject: string; bodyContentHtml: string; textBody: string }) {
  const html = buildMemberEmailHtml({
    title: params.subject,
    bodyContentHtml: params.bodyContentHtml,
  });
  const text = `${params.textBody}\n\n${buildEmailFooterText()}`;
  return { subject: params.subject, html, text };
}

export type MembershipWelcomeEmailOptions = {
  firstName: string;
  showAllAccessSetupLink?: boolean;
};

export function buildMembershipLevelWelcomeEmail(
  level: MembershipLevelKey,
  options: MembershipWelcomeEmailOptions,
) {
  const firstName = options.firstName.trim() || "there";
  const greeting = `Hey ${escapeHtml(firstName)},`;
  const submitUrl = `${getPublicAppUrl()}/coaching-submissions`;
  const priceLine = `You're billed ${MEMBERSHIP_LEVELS[level].priceDisplay}. You can change or cancel anytime in Settings &gt; My plan.`;
  const signoff = `<p style="margin:24px 0 0 0; font-family:Arial, Helvetica, sans-serif; font-size:15px; line-height:1.7; color:#0A1628;">Work hard. Be memorable.<br/>Coach Broc</p>`;

  if (level === "CORE") {
    const subject = "Welcome to Core";
    const bullets = [
      "Starter drills and 4-week workouts in the app",
      "Pregame, parent, nutrition, and arm care guides",
      "A written swing report from me every 6 weeks",
    ];
    const bodyContentHtml = `${paragraph(`${greeting}`)}
              ${paragraph("Welcome to Core. Here's what you've got:")}
              ${bulletList(bullets.map((b) => escapeHtml(b)))}
              ${paragraph("Start here: send me your first swing video and I'll send back your report.")}
              ${buildEmailButton("Send your swing", submitUrl)}
              ${paragraph(escapeHtml(priceLine.replace("&gt;", ">")))}
              ${signoff}`;
    const textBody = `Hey ${firstName},

Welcome to Core. Here's what you've got:
- Starter drills and 4-week workouts in the app
- Pregame, parent, nutrition, and arm care guides
- A written swing report from me every 6 weeks

Start here: send me your first swing video and I'll send back your report.
Send your swing: ${submitUrl}

You're billed $10/mo. You can change or cancel anytime in Settings > My plan.

Work hard. Be memorable.
Coach Broc`;
    return wrapMemberEmail({ subject, bodyContentHtml, textBody });
  }

  if (level === "PLUS") {
    const subject = "Welcome to Plus";
    const bullets = [
      "An in-depth video review from me every month",
      "The full drill library and workout programs",
      "The Playbook and all my guides",
      "Direct messaging with me (I usually reply within a couple of days)",
    ];
    const bodyContentHtml = `${paragraph(`${greeting}`)}
              ${paragraph("Welcome to Plus. I'm in your corner now. Here's what you've got:")}
              ${bulletList(bullets.map((b) => escapeHtml(b)))}
              ${paragraph("Start here: send me a swing video for your first review this month.")}
              ${buildEmailButton("Send your swing", submitUrl)}
              ${paragraph(escapeHtml(priceLine.replace("&gt;", ">")))}
              ${signoff}`;
    const textBody = `Hey ${firstName},

Welcome to Plus. I'm in your corner now. Here's what you've got:
- An in-depth video review from me every month
- The full drill library and workout programs
- The Playbook and all my guides
- Direct messaging with me (I usually reply within a couple of days)

Start here: send me a swing video for your first review this month.
Send your swing: ${submitUrl}

You're billed $20/mo. You can change or cancel anytime in Settings > My plan.

Work hard. Be memorable.
Coach Broc`;
    return wrapMemberEmail({ subject, bodyContentHtml, textBody });
  }

  const subject = "Welcome to All-Access";
  const setupUrl = `${getPublicAppUrl()}/program/start`;
  const setupBlock = options.showAllAccessSetupLink
    ? `${paragraph(`If you haven't finished setup yet, do that first: <a href="${escapeHtml(setupUrl)}" style="color:#2D6A4F;">Finish setup</a>`)}
              ${buildEmailButton("Finish setup", setupUrl)}`
    : "";
  const allAccessBullets = `<ul style="margin:0 0 16px 0; padding-left:20px; font-family:Arial, Helvetica, sans-serif; font-size:15px; line-height:1.7; color:#0A1628;">
    <li style="margin:0 0 8px 0;">Your daily plan is on the Today screen, about 30-45 minutes a day</li>
    <li style="margin:0 0 8px 0;">Send me one video a week (due Sunday night) and I'll send back a breakdown with notes and drills</li>
    <li style="margin:0 0 8px 0;">Message me anytime in the app. I usually reply within 24 hours</li>
    <li style="margin:0 0 8px 0;">We'll set up a quick 15-20 minute kickoff call with you and a parent this week: <a href="${escapeHtml(ALL_ACCESS_KICKOFF_URL)}" style="color:#2D6A4F;">book your kickoff call</a></li>
  </ul>`;
  const bodyContentHtml = `${paragraph(`${greeting}`)}
              ${paragraph("Welcome to All-Access. Let's get to work. Here's how it goes:")}
              ${allAccessBullets}
              ${setupBlock}
              ${paragraph("One question to think about before our call: What do you want to be known for?")}
              ${paragraph(escapeHtml(priceLine.replace("&gt;", ">")))}
              ${signoff}`;
  const textBody = `Hey ${firstName},

Welcome to All-Access. Let's get to work. Here's how it goes:
- Your daily plan is on the Today screen, about 30-45 minutes a day
- Send me one video a week (due Sunday night) and I'll send back a breakdown with notes and drills
- Message me anytime in the app. I usually reply within 24 hours
- We'll set up a quick 15-20 minute kickoff call with you and a parent this week: ${ALL_ACCESS_KICKOFF_URL}
${options.showAllAccessSetupLink ? `\nIf you haven't finished setup yet, do that first: ${setupUrl}\n` : ""}
One question to think about before our call: What do you want to be known for?

You're billed $249/mo. You can change or cancel anytime in Settings > My plan.

Work hard. Be memorable.
Coach Broc`;
  return wrapMemberEmail({ subject, bodyContentHtml, textBody });
}

export function formatCheckoutLevelLabelForCoachNotification(
  pendingCheckoutLevel: MembershipLevelKey | null | undefined,
): string {
  if (!pendingCheckoutLevel) {
    return "Free";
  }
  return formatMembershipLevelLabel(pendingCheckoutLevel);
}

export function formatSignupCheckoutLabelForCoachNotification(params: {
  pendingCheckoutLevel?: MembershipLevelKey | null;
  signupSource?: string | null;
  selectedMembershipTier?: DatabaseTier | null;
}): string {
  if (params.pendingCheckoutLevel) {
    return formatMembershipLevelLabel(params.pendingCheckoutLevel);
  }
  const source = params.signupSource?.trim().toLowerCase() ?? "";
  if (source === "program" || params.selectedMembershipTier === "TWELVE_WEEK") {
    return "12-Week Program";
  }
  if (source === "playbook" || params.selectedMembershipTier === "BASIC") {
    return "Playbook";
  }
  return "Free";
}

export function buildTwelveWeekProgramWelcomeEmail(options: MembershipWelcomeEmailOptions & {
  showSetupLink?: boolean;
}) {
  const firstName = options.firstName.trim() || "there";
  const greeting = `Hey ${escapeHtml(firstName)},`;
  const setupUrl = `${getPublicAppUrl()}/program/start`;
  const setupBlock = options.showSetupLink
    ? `${paragraph(`If you haven't finished setup yet, do that first: <a href="${escapeHtml(setupUrl)}" style="color:#2D6A4F;">Finish setup</a>`)}
              ${buildEmailButton("Finish setup", setupUrl)}`
    : "";
  const bullets = `<ul style="margin:0 0 16px 0; padding-left:20px; font-family:Arial, Helvetica, sans-serif; font-size:15px; line-height:1.7; color:#0A1628;">
    <li style="margin:0 0 8px 0;">Your daily plan is on the Today screen, about 30-45 minutes a day</li>
    <li style="margin:0 0 8px 0;">Send me one video a week (due Sunday night) and I'll send back a breakdown with notes and drills</li>
    <li style="margin:0 0 8px 0;">Message me anytime in the app. I usually reply within 24 hours</li>
    <li style="margin:0 0 8px 0;">We'll set up a quick 15-20 minute kickoff call with you and a parent this week: <a href="${escapeHtml(ALL_ACCESS_KICKOFF_URL)}" style="color:#2D6A4F;">${escapeHtml(ALL_ACCESS_KICKOFF_URL)}</a></li>
    <li style="margin:0 0 8px 0;">In Week 12, we'll compare your swing to Week 1</li>
  </ul>`;
  const signoff = `<p style="margin:24px 0 0 0; font-family:Arial, Helvetica, sans-serif; font-size:15px; line-height:1.7; color:#0A1628;">Work hard. Be memorable.<br/>Coach Broc</p>`;
  const subject = "Welcome to the 12-Week Program";
  const bodyContentHtml = `${paragraph(`${greeting}`)}
              ${paragraph("Welcome to the 12-Week Program. Let's get to work. Here's how it goes:")}
              ${bullets}
              ${setupBlock}
              ${paragraph("One question to think about before our call: What do you want to be known for?")}
              ${signoff}`;
  const textBody = `Hey ${firstName},

Welcome to the 12-Week Program. Let's get to work. Here's how it goes:
- Your daily plan is on the Today screen, about 30-45 minutes a day
- Send me one video a week (due Sunday night) and I'll send back a breakdown with notes and drills
- Message me anytime in the app. I usually reply within 24 hours
- We'll set up a quick 15-20 minute kickoff call with you and a parent this week: ${ALL_ACCESS_KICKOFF_URL}
- In Week 12, we'll compare your swing to Week 1
${options.showSetupLink ? `\nIf you haven't finished setup yet, do that first: ${setupUrl}\n` : ""}
One question to think about before our call: What do you want to be known for?

Work hard. Be memorable.
Coach Broc`;
  return wrapMemberEmail({ subject, bodyContentHtml, textBody });
}

export function buildCoachNewPaidMembershipEmailText(params: {
  level: MembershipLevelKey;
  name: string;
  email: string;
  orgName: string | null;
  memberAdminUrl: string;
}) {
  const levelLabel = formatMembershipLevelLabel(params.level);
  const price = MEMBERSHIP_LEVELS[params.level].priceDisplay;
  const orgLine = params.orgName?.trim()
    ? `Organization: ${params.orgName.trim()}`
    : "Organization: (none)";
  return `New ${levelLabel} member: ${params.name.trim() || params.email} (${price})

Email: ${params.email}
${orgLine}

Admin member page: ${params.memberAdminUrl}`;
}
