import "server-only";

import { sendNotificationEmail } from "@/lib/email-delivery-server";
import {
  buildEmailButton,
  buildEmailFooterText,
  buildEmailSectionLabel,
  buildMemberEmailHtml,
  EMAIL_REPLY_TO,
  escapeHtml,
  getPublicAppUrl,
} from "@/lib/email-layout";
import { buildLeadUnsubscribeUrl } from "@/lib/lead-unsubscribe-token";
import {
  formatCategoryBreakdown,
  getAnswerFeedback,
  getPlayerIqCta,
  getPlayerIqLevelMessage,
  PLAYER_IQ_LEVEL_DISPLAY,
  PLAYER_IQ_QUESTIONS,
  PLAYER_IQ_CATEGORY_TIPS,
  type PlayerIqAnswers,
  type PlayerIqCategoryScores,
  type PlayerIqLevel,
} from "@/lib/player-iq-quiz-shared";
import type { LeadRoleValue } from "@/lib/resources-shared";
import { buildCalendlyUrlWithLead } from "@/lib/resources-lead-shared";
import { buildSwingAnalysisSignupUrl } from "@/lib/resources-lead-shared";
import { prisma } from "@/lib/prisma";

const QUIZ_RESULTS_EMAIL_TYPE = "PLAYER_IQ_QUIZ_RESULTS";

function resolveCtaHref(
  ctaKey: string,
  params: { firstName: string; email: string; role: LeadRoleValue },
) {
  const base = getPublicAppUrl();
  if (ctaKey === "calendly") {
    return buildCalendlyUrlWithLead(params.firstName, params.email);
  }
  if (ctaKey === "free-swing-analysis") {
    if (params.role === "COACH") {
      return `${base}/swing-analysis`;
    }
    return `${base}${buildSwingAnalysisSignupUrl({
      firstName: params.firstName,
      email: params.email,
      role: params.role,
    })}`;
  }
  if (ctaKey.startsWith("/")) {
    return `${base}${ctaKey}`;
  }
  return `${base}/${ctaKey}`;
}

function buildMissedSectionHtml(answers: PlayerIqAnswers) {
  const wrong = PLAYER_IQ_QUESTIONS.filter(
    (question) => answers[question.id] !== question.correctOptionId,
  );

  if (wrong.length === 0) {
    return `<p style="margin:0; font-family:Arial, Helvetica, sans-serif; font-size:15px; line-height:1.7; color:#0A1628;">Perfect score. You think like a great player. Now let's make sure your work matches.</p>`;
  }

  const items = wrong
    .map((question) => {
      const feedback = getAnswerFeedback(question.id, answers[question.id] ?? "");
      if (!feedback) {
        return "";
      }
      return `<li style="margin:0 0 16px 0; font-family:Arial, Helvetica, sans-serif; font-size:14px; line-height:1.6; color:#0A1628;">
<strong>Q${question.order}. ${escapeHtml(question.prompt)}</strong><br/>
Your answer: ${escapeHtml(feedback.selectedOptionText)}<br/>
Correct: ${escapeHtml(feedback.correctOptionText)}<br/>
Why: ${escapeHtml(feedback.why)}
</li>`;
    })
    .join("");

  return `<ul style="margin:0; padding:0 0 0 18px;">${items}</ul>`;
}

function buildMissedSectionText(answers: PlayerIqAnswers) {
  const wrong = PLAYER_IQ_QUESTIONS.filter(
    (question) => answers[question.id] !== question.correctOptionId,
  );

  if (wrong.length === 0) {
    return "Perfect score. You think like a great player. Now let's make sure your work matches.";
  }

  return wrong
    .map((question) => {
      const feedback = getAnswerFeedback(question.id, answers[question.id] ?? "");
      if (!feedback) {
        return "";
      }
      return `Q${question.order}. ${question.prompt}
Your answer: ${feedback.selectedOptionText}
Correct: ${feedback.correctOptionText}
Why: ${feedback.why}`;
    })
    .join("\n\n");
}

export async function sendPlayerIqQuizResultsEmail(params: {
  attemptId: string;
  toEmail: string;
  firstName: string;
  role: LeadRoleValue;
  leadId: string | null;
  score: number;
  level: PlayerIqLevel;
  categoryScores: PlayerIqCategoryScores;
  lowestCategory: keyof typeof PLAYER_IQ_CATEGORY_TIPS;
  answers: PlayerIqAnswers;
}) {
  const dedupeKey = `${QUIZ_RESULTS_EMAIL_TYPE}:${params.attemptId}`;

  if (params.leadId) {
    const existing = await prisma.leadEmailLog.findUnique({
      where: { dedupeKey },
    });
    if (existing) {
      return;
    }
  }

  const levelLabel = PLAYER_IQ_LEVEL_DISPLAY[params.level];
  const subject = `Your Player IQ Quiz results: ${params.score}/15 (${levelLabel})`;
  const reviewUrl = `${getPublicAppUrl()}/quiz/results/${params.attemptId}`;
  const message = getPlayerIqLevelMessage(params.level, params.role);
  const cta = getPlayerIqCta(params.level, params.role);
  const ctaHref = resolveCtaHref(cta.primaryHref, {
    firstName: params.firstName,
    email: params.toEmail,
    role: params.role,
  });
  const breakdown = formatCategoryBreakdown(params.categoryScores);
  const tip = PLAYER_IQ_CATEGORY_TIPS[params.lowestCategory];

  const missedHtml = buildMissedSectionHtml(params.answers);
  const missedText = buildMissedSectionText(params.answers);

  const unsubscribeHtml = params.leadId
    ? `<p style="margin:24px 0 0 0; font-family:Arial, Helvetica, sans-serif; font-size:12px; line-height:1.6; color:#6B7280;"><a href="${escapeHtml(buildLeadUnsubscribeUrl(params.leadId))}" style="color:#2D6A4F; text-decoration:underline;">Unsubscribe from training tips and offers</a></p>`
    : "";

  const bodyContentHtml = `<p style="margin:0 0 16px 0; font-family:Arial, Helvetica, sans-serif; font-size:16px; line-height:1.7; color:#0A1628;">Hi ${escapeHtml(params.firstName)},</p>
<p style="margin:0 0 16px 0; font-family:Arial, Helvetica, sans-serif; font-size:16px; line-height:1.7; color:#0A1628;">You scored <strong>${params.score}/15</strong> (${escapeHtml(levelLabel)}).</p>
<p style="margin:0 0 16px 0; font-family:Arial, Helvetica, sans-serif; font-size:15px; line-height:1.7; color:#0A1628;">${escapeHtml(breakdown)}</p>
<p style="margin:0 0 16px 0; font-family:Arial, Helvetica, sans-serif; font-size:15px; line-height:1.7; color:#0A1628;">${escapeHtml(message)}</p>
<p style="margin:0 0 16px 0; font-family:Arial, Helvetica, sans-serif; font-size:14px; line-height:1.7; color:#6B7280;">Tip: ${escapeHtml(tip)}</p>
${buildEmailSectionLabel("What you missed")}
${missedHtml}
${buildEmailButton(cta.primaryLabel, ctaHref)}
${cta.secondaryLine ? `<p style="margin:12px 0 0 0; font-family:Arial, Helvetica, sans-serif; font-size:14px; line-height:1.6; color:#6B7280;">${escapeHtml(cta.secondaryLine)}</p>` : ""}
<p style="margin:20px 0 0 0; font-family:Arial, Helvetica, sans-serif; font-size:14px; line-height:1.7; color:#0A1628;"><a href="${escapeHtml(reviewUrl)}" style="color:#2D6A4F; text-decoration:underline;">Review all 15 questions</a></p>
${unsubscribeHtml}`;

  const text = `Hi ${params.firstName},

You scored ${params.score}/15 (${levelLabel}).

${breakdown}

${message}

Tip: ${tip}

WHAT YOU MISSED
${missedText}

${cta.primaryLabel}: ${ctaHref}
${cta.secondaryLine ?? ""}

Review all 15 questions: ${reviewUrl}
${params.leadId ? `\nUnsubscribe: ${buildLeadUnsubscribeUrl(params.leadId)}` : ""}

${buildEmailFooterText()}`;

  const fromEmail = process.env.NOTIFICATION_EMAIL;
  if (!fromEmail) {
    throw new Error("NOTIFICATION_EMAIL is required.");
  }

  await sendNotificationEmail({
    from: `"Coach Broc | LCB Training" <${fromEmail}>`,
    to: params.toEmail,
    replyTo: EMAIL_REPLY_TO,
    subject,
    html: buildMemberEmailHtml({ title: subject, bodyContentHtml }),
    text,
  });

  if (params.leadId) {
    await prisma.leadEmailLog.create({
      data: {
        leadId: params.leadId,
        type: QUIZ_RESULTS_EMAIL_TYPE,
        dedupeKey,
      },
    });
  }
}
