import {
  buildEmailButton,
  buildEmailFooterText,
  buildMemberEmailHtml,
  escapeHtml,
} from "@/lib/email-layout";
import { buildLeadUnsubscribeUrl } from "@/lib/lead-unsubscribe-token-shared";
import { getPublicAppUrl } from "@/lib/public-app-url";

function buildLeadUnsubscribeFooterHtml(leadId: string) {
  const url = buildLeadUnsubscribeUrl(leadId);
  return `<p style="margin:24px 0 0 0; font-family:Arial, Helvetica, sans-serif; font-size:12px; line-height:1.6; color:#6B7280;"><a href="${escapeHtml(url)}" style="color:#2D6A4F; text-decoration:underline;">Unsubscribe from training tips and offers</a></p>`;
}

function buildLeadUnsubscribeFooterText(leadId: string) {
  return `\nUnsubscribe: ${buildLeadUnsubscribeUrl(leadId)}`;
}

function defaultSignupUrl() {
  return `${getPublicAppUrl()}/auth?redirect=${encodeURIComponent("/swing-analysis")}`;
}

function formatLeadResourceThanksPhrase(resourceTitle?: string | null) {
  const trimmed = resourceTitle?.trim();
  if (trimmed) {
    return trimmed;
  }
  return "one of my free resources";
}

export function buildLeadDay3FreeAccountInviteEmailContent(params: {
  firstName: string;
  leadId: string;
  resourceTitle?: string | null;
  signupUrl?: string;
}) {
  const signupUrl = params.signupUrl ?? defaultSignupUrl();
  const subject = "Your free swing breakdown";
  const resourcePhrase = formatLeadResourceThanksPhrase(params.resourceTitle);
  const bodyHtml = `<p style="margin:0 0 16px 0; font-family:Arial, Helvetica, sans-serif; font-size:16px; line-height:1.7; color:#0A1628;">Hi ${escapeHtml(params.firstName)},</p>
<p style="margin:0 0 16px 0; font-family:Arial, Helvetica, sans-serif; font-size:16px; line-height:1.7; color:#0A1628;">Thanks for grabbing ${escapeHtml(resourcePhrase)}. Want to take it a step further? Create a free account and send me a swing video. I'll personally break it down and give you a drill to work on.</p>
${buildEmailButton("Create your free account", signupUrl)}
${buildLeadUnsubscribeFooterHtml(params.leadId)}`;

  const text = `Hi ${params.firstName},

Thanks for grabbing ${resourcePhrase}. Want to take it a step further? Create a free account and send me a swing video. I'll personally break it down and give you a drill to work on.

Create your free account: ${signupUrl}${buildLeadUnsubscribeFooterText(params.leadId)}

${buildEmailFooterText()}`;

  return {
    subject,
    html: buildMemberEmailHtml({ title: subject, bodyContentHtml: bodyHtml }),
    text,
  };
}

export function buildLegacyLeadFreeAccountInviteEmailContent(params: {
  firstName: string;
  leadId: string;
  signupUrl?: string;
}) {
  const signupUrl = params.signupUrl ?? defaultSignupUrl();
  const subject = "Still want a free swing breakdown?";
  const bodyHtml = `<p style="margin:0 0 16px 0; font-family:Arial, Helvetica, sans-serif; font-size:16px; line-height:1.7; color:#0A1628;">Hi ${escapeHtml(params.firstName)},</p>
<p style="margin:0 0 16px 0; font-family:Arial, Helvetica, sans-serif; font-size:16px; line-height:1.7; color:#0A1628;">A while back you grabbed one of my free resources. Since then I've built out the LCB Training app, and every new account gets one free swing breakdown from me.</p>
<p style="margin:0 0 16px 0; font-family:Arial, Helvetica, sans-serif; font-size:16px; line-height:1.7; color:#0A1628;">Create a free account, send me a few swings, and I'll tell you what I see and give you a drill to work on.</p>
${buildEmailButton("Create your free account", signupUrl)}
${buildLeadUnsubscribeFooterHtml(params.leadId)}`;

  const text = `Hi ${params.firstName},

A while back you grabbed one of my free resources. Since then I've built out the LCB Training app, and every new account gets one free swing breakdown from me.

Create a free account, send me a few swings, and I'll tell you what I see and give you a drill to work on.

Create your free account: ${signupUrl}${buildLeadUnsubscribeFooterText(params.leadId)}

${buildEmailFooterText()}`;

  return {
    subject,
    html: buildMemberEmailHtml({ title: subject, bodyContentHtml: bodyHtml }),
    text,
  };
}

/** @deprecated Use buildLeadDay3FreeAccountInviteEmailContent */
export function buildLeadFreeAccountInviteEmailContent(params: {
  firstName: string;
  leadId: string;
  signupUrl?: string;
  resourceTitle?: string | null;
}) {
  return buildLeadDay3FreeAccountInviteEmailContent(params);
}
