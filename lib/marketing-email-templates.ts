import {
  buildEmailButton,
  buildEmailFooterText,
  buildEmailTestimonialsBlockHtml,
  buildEmailTestimonialsBlockText,
  buildMemberEmailHtml,
  escapeHtml,
} from "@/lib/email-layout";
import { buildDrillLibraryUrl } from "@/lib/email-layout";
import {
  buildSubmissionBreakdownUrl,
  getMarketingAssessmentCallUrl,
  getMarketingCoachingSubmissionsUrl,
  getMarketingProgramUrl,
  type MarketingEmailTypeValue,
} from "@/lib/marketing-email-shared";
import { buildMarketingUnsubscribeUrl } from "@/lib/marketing-unsubscribe-token";

export type MarketingEmailRecipient = {
  userId: string;
  email: string;
  firstName: string;
  playerFirstName?: string;
  accountRole?: "PLAYER" | "PARENT";
  accountHolderFirstName?: string;
  ownsPlaybook: boolean;
  playbookBreakdownsRemaining?: number | null;
};

function getMarketingGreeting(recipient: MarketingEmailRecipient) {
  if (recipient.accountRole === "PARENT" && recipient.accountHolderFirstName) {
    return `Hi ${recipient.accountHolderFirstName}`;
  }

  return `Hey ${recipient.firstName || "there"}`;
}

function heyGreeting(recipient: MarketingEmailRecipient) {
  return `Hey ${recipient.firstName || "there"}`;
}

export type FollowupSubmissionContext = {
  submissionId: string;
  submissionType: "SWING" | "MENTAL";
  responseSummary: string;
  respondedAt: Date;
  recommendedDrillIds: string[];
};

function paragraph(text: string) {
  return `<p style="margin:0 0 16px 0; font-family:Arial, Helvetica, sans-serif; font-size:15px; line-height:1.7; color:#0A1628;">${text}</p>`;
}

function unorderedListHtml(items: string[]) {
  const listItems = items
    .map(
      (item) =>
        `<li style="margin:0 0 8px 0; font-family:Arial, Helvetica, sans-serif; font-size:15px; line-height:1.7; color:#0A1628;">${item}</li>`,
    )
    .join("");
  return `<ul style="margin:0 0 16px 0; padding-left:20px;">${listItems}</ul>`;
}

function unorderedListText(items: string[]) {
  return items.map((item) => `- ${item}`).join("\n");
}

function buildMarketingUnsubscribeFooterHtml(userId: string) {
  const url = buildMarketingUnsubscribeUrl(userId);
  return `<p style="margin:24px 0 0 0; font-family:Arial, Helvetica, sans-serif; font-size:12px; line-height:1.6; color:#6B7280;"><a href="${escapeHtml(url)}" style="color:#2D6A4F; text-decoration:underline;">Unsubscribe from marketing emails</a></p>`;
}

function buildMarketingUnsubscribeFooterText(userId: string) {
  return `\nUnsubscribe from marketing emails: ${buildMarketingUnsubscribeUrl(userId)}`;
}

function wrapMarketingEmail(params: {
  title: string;
  bodyContentHtml: string;
  textBody: string;
  userId: string;
}) {
  const html = buildMemberEmailHtml({
    title: params.title,
    bodyContentHtml: `${params.bodyContentHtml}${buildMarketingUnsubscribeFooterHtml(params.userId)}`,
  });
  const text = `${params.textBody}${buildMarketingUnsubscribeFooterText(params.userId)}\n\n${buildEmailFooterText()}`;
  return { subject: params.title, html, text };
}

export function buildWelcomeMarketingEmail(recipient: MarketingEmailRecipient) {
  const greeting = getMarketingGreeting(recipient);
  const submitUrl = getMarketingCoachingSubmissionsUrl();
  const assessmentCallUrl = getMarketingAssessmentCallUrl();

  const bodyContentHtml = `<h1 style="margin:0 0 16px 0; font-family:Arial, Helvetica, sans-serif; font-size:24px; line-height:1.3; color:#0A1628;">Welcome to LCB Training</h1>
              ${paragraph(`${escapeHtml(greeting)},`)}
              ${paragraph(
                "Glad you're here. Your free swing breakdown is waiting. Send me a swing video (or a mental game question) and I'll personally break it down for you.",
              )}
              ${buildEmailButton("Send your free video", submitUrl)}
              ${paragraph(
                `Want to talk first? Book a quick call with me: <a href="${escapeHtml(assessmentCallUrl)}" style="color:#2D6A4F; text-decoration:underline;">${escapeHtml(assessmentCallUrl)}</a>`,
              )}
              ${paragraph("Work hard. Be memorable.")}`;

  const textBody = `${greeting},

Glad you're here. Your free swing breakdown is waiting. Send me a swing video (or a mental game question) and I'll personally break it down for you.

Send your free video: ${submitUrl}

Want to talk first? Book a quick call with me: ${assessmentCallUrl}

Work hard. Be memorable.`;

  return wrapMarketingEmail({
    title: "Welcome to LCB Training",
    bodyContentHtml,
    textBody,
    userId: recipient.userId,
  });
}

export function buildFreeSubmissionReminderEmail(recipient: MarketingEmailRecipient) {
  const greeting = heyGreeting(recipient);
  const submitUrl = getMarketingCoachingSubmissionsUrl();

  const bodyContentHtml = `<h1 style="margin:0 0 16px 0; font-family:Arial, Helvetica, sans-serif; font-size:24px; line-height:1.3; color:#0A1628;">Your free breakdown is waiting</h1>
              ${paragraph(`${escapeHtml(greeting)},`)}
              ${paragraph(
                "Quick reminder: your free breakdown is still open. Grab your phone, film a few swings from the side, and send them over. I'll tell you what I see and give you a drill or two to work on.",
              )}
              ${buildEmailButton("Send your swing", submitUrl)}`;

  const textBody = `${greeting},

Quick reminder: your free breakdown is still open. Grab your phone, film a few swings from the side, and send them over. I'll tell you what I see and give you a drill or two to work on.

Send your swing: ${submitUrl}`;

  return wrapMarketingEmail({
    title: "Your free breakdown is waiting",
    bodyContentHtml,
    textBody,
    userId: recipient.userId,
  });
}

export function buildFollowupDrillsDay2Email(
  recipient: MarketingEmailRecipient,
  submission: FollowupSubmissionContext,
) {
  const greeting = heyGreeting(recipient);
  const breakdownUrl = buildSubmissionBreakdownUrl({
    submissionType: submission.submissionType,
    submissionId: submission.submissionId,
  });
  const firstDrillId = submission.recommendedDrillIds.find((id) => id.trim())?.trim();
  const primaryUrl = firstDrillId ? buildDrillLibraryUrl(firstDrillId) : breakdownUrl;
  const summary = submission.responseSummary.trim() || "your latest breakdown";

  const bodyContentHtml = `<h1 style="margin:0 0 16px 0; font-family:Arial, Helvetica, sans-serif; font-size:24px; line-height:1.3; color:#0A1628;">Did you try the drills?</h1>
              ${paragraph(`${escapeHtml(greeting)},`)}
              ${paragraph(
                `A couple days ago I sent your breakdown. Quick recap: ${escapeHtml(summary)}`,
              )}
              ${paragraph(
                "Reps are where it changes. Go get after the drill I gave you, then reply and let me know how it felt.",
              )}
              ${buildEmailButton("Open your drill", primaryUrl)}`;

  const textBody = `${greeting},

A couple days ago I sent your breakdown. Quick recap: ${summary}

Reps are where it changes. Go get after the drill I gave you, then reply and let me know how it felt.

Open your drill: ${primaryUrl}`;

  return wrapMarketingEmail({
    title: "Did you try the drills?",
    bodyContentHtml,
    textBody,
    userId: recipient.userId,
  });
}

export function buildFollowupOtherSixDay4Email(recipient: MarketingEmailRecipient) {
  const greeting = heyGreeting(recipient);
  const programUrl = getMarketingProgramUrl();
  const bullets = [
    "A daily plan built for you (about 30-45 minutes)",
    "A weekly focus I set just for you",
    "A video breakdown from me every week",
    "Direct messaging with me",
  ];

  const bodyContentHtml = `<h1 style="margin:0 0 16px 0; font-family:Arial, Helvetica, sans-serif; font-size:24px; line-height:1.3; color:#0A1628;">Lessons are one day a week. What happens the other six?</h1>
              ${paragraph(`${escapeHtml(greeting)},`)}
              ${paragraph(
                "A breakdown is a great start. But lessons and breakdowns are one day a week. What happens the other six?",
              )}
              ${paragraph("That's what the 12-Week Coaching Program is for:")}
              ${unorderedListHtml(bullets.map((item) => escapeHtml(item)))}
              ${buildEmailButton("See the 12-Week Program", programUrl)}`;

  const textBody = `${greeting},

A breakdown is a great start. But lessons and breakdowns are one day a week. What happens the other six?

That's what the 12-Week Coaching Program is for:
${unorderedListText(bullets)}

See the 12-Week Program: ${programUrl}`;

  return wrapMarketingEmail({
    title: "Lessons are one day a week. What happens the other six?",
    bodyContentHtml,
    textBody,
    userId: recipient.userId,
  });
}

export function buildFollowupSampleDayDay7Email(recipient: MarketingEmailRecipient) {
  const greeting = heyGreeting(recipient);
  const programUrl = getMarketingProgramUrl();
  const bullets = [
    "Hitting: tee or front toss reps with your weekly focus",
    "Fielding: footwork and glove work",
    "Workout: a short strength or speed session",
    "Mindset: one prompt to stay locked in",
  ];

  const bodyContentHtml = `<h1 style="margin:0 0 16px 0; font-family:Arial, Helvetica, sans-serif; font-size:24px; line-height:1.3; color:#0A1628;">What a day in the program looks like</h1>
              ${paragraph(`${escapeHtml(greeting)},`)}
              ${paragraph("Here's what a day in the 12-Week Program looks like:")}
              ${unorderedListHtml(bullets.map((item) => escapeHtml(item)))}
              ${paragraph("About 30-45 minutes, and every rep has a purpose.")}
              ${buildEmailTestimonialsBlockHtml()}
              ${buildEmailButton("See the 12-Week Program", programUrl)}`;

  const textBody = `${greeting},

Here's what a day in the 12-Week Program looks like:
${unorderedListText(bullets)}

About 30-45 minutes, and every rep has a purpose.
${buildEmailTestimonialsBlockText()}

See the 12-Week Program: ${programUrl}`;

  return wrapMarketingEmail({
    title: "What a day in the program looks like",
    bodyContentHtml,
    textBody,
    userId: recipient.userId,
  });
}

function buildDay10OtherWaysBlocks(recipient: MarketingEmailRecipient) {
  const inPersonLine =
    "In-person lessons in Palatine. Reply to this email and we'll find a time.";

  if (recipient.ownsPlaybook) {
    const remaining = recipient.playbookBreakdownsRemaining;
    const bullets: string[] = [];
    if (remaining != null && remaining > 0) {
      const breakdownWord = remaining === 1 ? "breakdown" : "breakdowns";
      bullets.push(
        `You still have ${remaining} Playbook ${breakdownWord} left. Send me a video anytime.`,
      );
    }
    bullets.push(inPersonLine);

    return {
      html: `${paragraph("Other ways to work with me:")}${unorderedListHtml(bullets.map((item) => escapeHtml(item)))}`,
      text: `\nOther ways to work with me:\n${unorderedListText(bullets)}`,
    };
  }

  const bullets = [
    "The Next Level Playbook ($59): my mindset guide, starter drills, and 1 personal breakdown from me",
    inPersonLine,
  ];

  return {
    html: `${paragraph("Other ways to work with me:")}${unorderedListHtml(bullets.map((item) => escapeHtml(item)))}`,
    text: `\nOther ways to work with me:\n${unorderedListText(bullets)}`,
  };
}

export function buildFollowupKnownForDay10Email(recipient: MarketingEmailRecipient) {
  const greeting = heyGreeting(recipient);
  const programUrl = getMarketingProgramUrl();
  const assessmentCallUrl = getMarketingAssessmentCallUrl();
  const otherWays = buildDay10OtherWaysBlocks(recipient);

  const bodyContentHtml = `<h1 style="margin:0 0 16px 0; font-family:Arial, Helvetica, sans-serif; font-size:24px; line-height:1.3; color:#0A1628;">What do you want to be known for?</h1>
              ${paragraph(`${escapeHtml(greeting)},`)}
              ${paragraph(
                "That's the question I ask every player I work with. Hard worker? Clutch hitter? The player who never gives away an at-bat?",
              )}
              ${paragraph("Whatever your answer is, it gets built on the days nobody's watching.")}
              ${paragraph(
                "If you want me in your corner every day, the 12-Week Program is where that happens.",
              )}
              ${buildEmailButton("Join the 12-Week Program", programUrl)}
              ${paragraph(
                `Not sure yet? Book a call and we'll talk it through: <a href="${escapeHtml(assessmentCallUrl)}" style="color:#2D6A4F; text-decoration:underline;">${escapeHtml(assessmentCallUrl)}</a>`,
              )}
              ${otherWays.html}`;

  const textBody = `${greeting},

That's the question I ask every player I work with. Hard worker? Clutch hitter? The player who never gives away an at-bat?

Whatever your answer is, it gets built on the days nobody's watching.

If you want me in your corner every day, the 12-Week Program is where that happens.

Join the 12-Week Program: ${programUrl}

Not sure yet? Book a call and we'll talk it through: ${assessmentCallUrl}${otherWays.text}`;

  return wrapMarketingEmail({
    title: "What do you want to be known for?",
    bodyContentHtml,
    textBody,
    userId: recipient.userId,
  });
}

export function buildMarketingEmailContent(
  type: MarketingEmailTypeValue,
  recipient: MarketingEmailRecipient,
  submission?: FollowupSubmissionContext,
) {
  switch (type) {
    case "WELCOME":
      return buildWelcomeMarketingEmail(recipient);
    case "FREE_SUBMISSION_REMINDER":
      return buildFreeSubmissionReminderEmail(recipient);
    case "FOLLOWUP_DRILLS_DAY_2":
      if (!submission) {
        throw new Error("Submission context is required for day 2 follow-up.");
      }
      return buildFollowupDrillsDay2Email(recipient, submission);
    case "FOLLOWUP_OTHER_SIX_DAY_4":
      return buildFollowupOtherSixDay4Email(recipient);
    case "FOLLOWUP_SAMPLE_DAY_DAY_7":
      return buildFollowupSampleDayDay7Email(recipient);
    case "FOLLOWUP_KNOWN_FOR_DAY_10":
      return buildFollowupKnownForDay10Email(recipient);
    default:
      throw new Error(`Unsupported marketing email type: ${type}`);
  }
}

export function buildMarketingTestSubmissionContext(): FollowupSubmissionContext {
  return {
    submissionId: "test-submission",
    submissionType: "SWING",
    responseSummary:
      "You are getting out front on offspeed pitches. Stay back through contact and let the ball travel.",
    respondedAt: new Date(),
    recommendedDrillIds: ["1200422510"],
  };
}
