import {
  buildEmailButton,
  buildEmailDivider,
  buildEmailFooterText,
  buildEmailInfoBox,
  buildEmailTestimonialsBlockHtml,
  buildEmailTestimonialsBlockText,
  buildMemberEmailHtml,
  escapeHtml,
} from "@/lib/email-layout";
import { buildDrillLibraryUrl } from "@/lib/email-layout";
import {
  buildSubmissionBreakdownUrl,
  getInPersonLessonsLine,
  getMarketingCoachingSubmissionsUrl,
  getMarketingAssessmentCallUrl,
  getMarketingProgramUrl,
  getPlaybookOfferLine,
  type MarketingEmailTypeValue,
} from "@/lib/marketing-email-shared";
import { buildMarketingUnsubscribeUrl } from "@/lib/marketing-unsubscribe-token";
import {
  TWELVE_WEEK_PROGRAM_NAME,
  TWELVE_WEEK_PROGRAM_PRICE_LABEL,
} from "@/lib/twelve-week-program";

export type MarketingEmailRecipient = {
  userId: string;
  email: string;
  firstName: string;
  playerFirstName?: string;
  accountRole?: "PLAYER" | "PARENT";
  accountHolderFirstName?: string;
  ownsPlaybook: boolean;
};

function getMarketingGreeting(recipient: MarketingEmailRecipient) {
  if (recipient.accountRole === "PARENT" && recipient.accountHolderFirstName) {
    return `Hi ${recipient.accountHolderFirstName}`;
  }

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
  const firstName = recipient.firstName || "there";
  const programUrl = getMarketingProgramUrl();
  const submitUrl = getMarketingCoachingSubmissionsUrl();

  const bodyContentHtml = `<h1 style="margin:0 0 16px 0; font-family:Arial, Helvetica, sans-serif; font-size:24px; line-height:1.3; color:#0A1628;">Welcome to LCB Training</h1>
              ${paragraph(`${escapeHtml(greeting)},`)}
              ${paragraph(
                "Glad you are here. You have one free swing analysis or mental game submission waiting. Send me a video and I will personally break it down for you.",
              )}
              ${paragraph(
                "You can also book a call with me if you want to talk through the 12-Week Program first.",
              )}
              ${buildEmailButton("Send Your Free Video", submitUrl)}
              ${buildEmailDivider()}
              ${paragraph(
                `When you are ready for daily coaching, check out the ${escapeHtml(TWELVE_WEEK_PROGRAM_NAME)} (${escapeHtml(TWELVE_WEEK_PROGRAM_PRICE_LABEL)} one time).`,
              )}
              ${buildEmailButton("See the 12-Week Program", programUrl)}`;

  const textBody = `${greeting},

Glad you are here. You have one free swing analysis or mental game submission waiting. Send me a video and I will personally break it down for you.

You can also book a call with me if you want to talk through the 12-Week Program first.

Send your free video: ${submitUrl}

When you are ready for daily coaching, check out the ${TWELVE_WEEK_PROGRAM_NAME}.
See the program: ${programUrl}`;

  return wrapMarketingEmail({
    title: "Welcome to LCB Training",
    bodyContentHtml,
    textBody,
    userId: recipient.userId,
  });
}

export function buildFreeSubmissionReminderEmail(recipient: MarketingEmailRecipient) {
  const firstName = recipient.firstName || "there";
  const submitUrl = getMarketingCoachingSubmissionsUrl();

  const bodyContentHtml = `<h1 style="margin:0 0 16px 0; font-family:Arial, Helvetica, sans-serif; font-size:24px; line-height:1.3; color:#0A1628;">Your free breakdown is waiting</h1>
              ${paragraph(`Hey ${escapeHtml(firstName)},`)}
              ${paragraph(
                "You signed up a couple days ago and your one free coaching submission is still open. Send me a swing video or a mental game question and I will send you personal feedback.",
              )}
              ${buildEmailButton("Submit Your Free Video", submitUrl)}`;

  const textBody = `Hey ${firstName},

You signed up a couple days ago and your one free coaching submission is still open. Send me a swing video or a mental game question and I will send you personal feedback.

Submit your free video: ${submitUrl}`;

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
  const firstName = recipient.firstName || "there";
  const breakdownUrl = buildSubmissionBreakdownUrl({
    submissionType: submission.submissionType,
    submissionId: submission.submissionId,
  });
  const firstDrillId = submission.recommendedDrillIds.find((id) => id.trim())?.trim();
  const primaryUrl = firstDrillId ? buildDrillLibraryUrl(firstDrillId) : breakdownUrl;
  const buttonLabel = firstDrillId ? "Open Your Drills" : "Open Your Breakdown";
  const summary = submission.responseSummary.trim() || "your latest breakdown";

  const bodyContentHtml = `<h1 style="margin:0 0 16px 0; font-family:Arial, Helvetica, sans-serif; font-size:24px; line-height:1.3; color:#0A1628;">Did you try the drills?</h1>
              ${paragraph(`Hey ${escapeHtml(firstName)},`)}
              ${paragraph(
                `A couple days ago I sent your breakdown. Here is what I found: ${escapeHtml(summary)}`,
              )}
              ${paragraph(
                "Go try the drills I gave you and send me a quick note on how it went. Even one sentence helps me coach you better.",
              )}
              ${buildEmailButton(buttonLabel, primaryUrl)}`;

  const textBody = `Hey ${firstName},

A couple days ago I sent your breakdown. Here is what I found: ${summary}

Go try the drills I gave you and send me a quick note on how it went.

${buttonLabel}: ${primaryUrl}`;

  return wrapMarketingEmail({
    title: "Did you try the drills?",
    bodyContentHtml,
    textBody,
    userId: recipient.userId,
  });
}

export function buildFollowupOtherSixDay4Email(recipient: MarketingEmailRecipient) {
  const firstName = recipient.firstName || "there";
  const programUrl = getMarketingProgramUrl();

  const bodyContentHtml = `<h1 style="margin:0 0 16px 0; font-family:Arial, Helvetica, sans-serif; font-size:24px; line-height:1.3; color:#0A1628;">Lessons are one day a week. What happens the other six?</h1>
              ${paragraph(`Hey ${escapeHtml(firstName)},`)}
              ${paragraph(
                "One breakdown is a great start. The 12-Week Coaching Program is what happens on the other six days.",
              )}
              ${paragraph(
                "You get a daily plan built for you, I set your focus every week, a video breakdown every week, game and practice logging, and notifications so you never wonder what to do.",
              )}
              ${buildEmailButton("See the 12-Week Program", programUrl)}`;

  const textBody = `Hey ${firstName},

One breakdown is a great start. The 12-Week Coaching Program is what happens on the other six days.

You get a daily plan built for you, I set your focus every week, a video breakdown every week, game and practice logging, and notifications so you never wonder what to do.

See the 12-Week Program: ${programUrl}`;

  return wrapMarketingEmail({
    title: "Lessons are one day a week. What happens the other six?",
    bodyContentHtml,
    textBody,
    userId: recipient.userId,
  });
}

export function buildFollowupSampleDayDay7Email(recipient: MarketingEmailRecipient) {
  const firstName = recipient.firstName || "there";
  const programUrl = getMarketingProgramUrl();

  const sampleDayHtml = buildEmailInfoBox(`<p style="margin:0 0 8px 0; font-family:Arial, Helvetica, sans-serif; font-size:15px; line-height:1.7; color:#0A1628;"><strong style="color:#0A1628;">Hitting:</strong> Tee or front toss reps with your weekly focus cue</p>
        <p style="margin:0 0 8px 0; font-family:Arial, Helvetica, sans-serif; font-size:15px; line-height:1.7; color:#0A1628;"><strong style="color:#0A1628;">Fielding:</strong> Footwork and glove work reps</p>
        <p style="margin:0 0 8px 0; font-family:Arial, Helvetica, sans-serif; font-size:15px; line-height:1.7; color:#0A1628;"><strong style="color:#0A1628;">Workout:</strong> A short strength or speed session from your plan</p>
        <p style="margin:0; font-family:Arial, Helvetica, sans-serif; font-size:15px; line-height:1.7; color:#0A1628;"><strong style="color:#0A1628;">Mindset:</strong> One prompt to stay locked in before you compete</p>`);

  const bodyContentHtml = `<h1 style="margin:0 0 16px 0; font-family:Arial, Helvetica, sans-serif; font-size:24px; line-height:1.3; color:#0A1628;">What a day in the program looks like</h1>
              ${paragraph(`Hey ${escapeHtml(firstName)},`)}
              ${paragraph("Here is a sample day inside the 12-Week Coaching Program:")}
              ${sampleDayHtml}
              ${buildEmailTestimonialsBlockHtml()}
              ${buildEmailButton("See the 12-Week Program", programUrl)}`;

  const textBody = `Hey ${firstName},

Here is a sample day inside the 12-Week Coaching Program:

Hitting: Tee or front toss reps with your weekly focus cue
Fielding: Footwork and glove work reps
Workout: A short strength or speed session from your plan
Mindset: One prompt to stay locked in before you compete
${buildEmailTestimonialsBlockText()}

See the 12-Week Program: ${programUrl}`;

  return wrapMarketingEmail({
    title: "What a day in the program looks like",
    bodyContentHtml,
    textBody,
    userId: recipient.userId,
  });
}

export function buildFollowupKnownForDay10Email(recipient: MarketingEmailRecipient) {
  const firstName = recipient.firstName || "there";
  const programUrl = getMarketingProgramUrl();
  const assessmentCallUrl = getMarketingAssessmentCallUrl();
  const playbookLine = recipient.ownsPlaybook
    ? ""
    : `<p style="margin:16px 0 0 0; font-family:Arial, Helvetica, sans-serif; font-size:14px; line-height:1.7; color:#6B7280;">Other ways to work with me: ${escapeHtml(getPlaybookOfferLine())} or ${escapeHtml(getInPersonLessonsLine())}.</p>`;
  const playbookText = recipient.ownsPlaybook
    ? ""
    : `\nOther ways to work with me: ${getPlaybookOfferLine()} or ${getInPersonLessonsLine()}.`;

  const bodyContentHtml = `<h1 style="margin:0 0 16px 0; font-family:Arial, Helvetica, sans-serif; font-size:24px; line-height:1.3; color:#0A1628;">What do you want to be known for?</h1>
              ${paragraph(`Hey ${escapeHtml(firstName)},`)}
              ${paragraph(
                "That is the question I ask every player I work with. Effort is a skill, and it is the kind that gets you remembered.",
              )}
              ${paragraph(
                'Work Hard. Be Memorable. If you want me in your corner every day, the 12-Week Coaching Program is where that happens.',
              )}
              ${buildEmailButton("Join the 12-Week Program", programUrl)}
              ${paragraph(
                `Not ready for daily coaching? Book a call and we can talk through the 12-Week Program first. Visit ${escapeHtml(assessmentCallUrl)}.`,
              )}
              ${playbookLine}`;

  const textBody = `Hey ${firstName},

That is the question I ask every player I work with. Effort is a skill, and it is the kind that gets you remembered.

Work Hard. Be Memorable. If you want me in your corner every day, the 12-Week Coaching Program is where that happens.

Join the 12-Week Program: ${programUrl}

Not ready for daily coaching? Book a call and we can talk through the 12-Week Program first: ${assessmentCallUrl}${playbookText}`;

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
