import {
  buildEmailButton,
  buildEmailFooterText,
  buildMemberEmailHtml,
  escapeHtml,
  getPublicAppUrl,
} from "@/lib/email-layout";
import { LEGAL_PAGE_PATHS } from "@/lib/legal-shared";
import { buildParentConsentConfirmUrl } from "@/lib/parent-consent-token";

function getPlayerFirstName(name: string | null | undefined, email: string) {
  const source = (name ?? email).trim();
  const first = source.split(/\s+/)[0] ?? source;
  return first || "Player";
}

function buildLegalLinksHtml() {
  const appUrl = getPublicAppUrl();
  const links = [
    { label: "Terms of Service", href: `${appUrl}${LEGAL_PAGE_PATHS.terms}` },
    { label: "Privacy Policy", href: `${appUrl}${LEGAL_PAGE_PATHS.privacy}` },
    { label: "Waiver", href: `${appUrl}${LEGAL_PAGE_PATHS.waiver}` },
  ];

  return links
    .map(
      (link) =>
        `<a href="${escapeHtml(link.href)}" style="color:#2D6A4F; text-decoration:underline;">${escapeHtml(link.label)}</a>`,
    )
    .join(", ");
}

function buildLegalLinksText() {
  const appUrl = getPublicAppUrl();
  return [
    `Terms: ${appUrl}${LEGAL_PAGE_PATHS.terms}`,
    `Privacy: ${appUrl}${LEGAL_PAGE_PATHS.privacy}`,
    `Waiver: ${appUrl}${LEGAL_PAGE_PATHS.waiver}`,
  ].join("\n");
}

function formatAgreementDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export type ParentConsentEmailAudience = "third_party_parent" | "parent_account_holder";

export function buildParentConsentConfirmEmail(params: {
  userId: string;
  playerName: string | null;
  playerEmail: string;
  agreedByName: string;
  agreedAt: Date;
  isReminder?: boolean;
  audience?: ParentConsentEmailAudience;
}) {
  const playerFirstName = getPlayerFirstName(params.playerName, params.playerEmail);
  const audience = params.audience ?? "third_party_parent";
  const confirmUrl = buildParentConsentConfirmUrl(params.userId);
  const dateLabel = formatAgreementDate(params.agreedAt);

  const subject =
    audience === "parent_account_holder"
      ? `Confirm your email to finish setting up ${playerFirstName}'s account`
      : `Please confirm ${playerFirstName}'s LCB Training agreement`;

  const intro =
    audience === "parent_account_holder"
      ? params.isReminder
        ? `Reminder: confirm your email to finish setting up ${escapeHtml(playerFirstName)}&apos;s LCB Training account.`
        : `Confirm your email to finish setting up ${escapeHtml(playerFirstName)}&apos;s LCB Training account.`
      : params.isReminder
        ? `This is a friendly reminder to confirm ${playerFirstName}'s LCB Training agreement.`
        : `${escapeHtml(params.agreedByName)} agreed to LCB Training on behalf of ${escapeHtml(playerFirstName)}.`;

  const heading =
    audience === "parent_account_holder"
      ? `Confirm your email for ${escapeHtml(playerFirstName)}&apos;s account`
      : `Please confirm ${escapeHtml(playerFirstName)}&apos;s agreement`;

  const confirmLabel = audience === "parent_account_holder" ? "Confirm my email" : "Yes, I agreed";

  const bodyContentHtml = `<h1 style="margin:0 0 16px 0; font-family:Arial, Helvetica, sans-serif; font-size:24px; line-height:1.3; color:#0A1628;">${heading}</h1>
      <p style="margin:0 0 16px 0; font-family:Arial, Helvetica, sans-serif; font-size:15px; line-height:1.7; color:#0A1628;">${intro}</p>
      <p style="margin:0 0 8px 0; font-family:Arial, Helvetica, sans-serif; font-size:14px; line-height:1.6; color:#0A1628;"><strong>Player:</strong> ${escapeHtml(params.playerName?.trim() || params.playerEmail)}</p>
      <p style="margin:0 0 8px 0; font-family:Arial, Helvetica, sans-serif; font-size:14px; line-height:1.6; color:#0A1628;"><strong>Agreed by:</strong> ${escapeHtml(params.agreedByName)}</p>
      <p style="margin:0 0 16px 0; font-family:Arial, Helvetica, sans-serif; font-size:14px; line-height:1.6; color:#0A1628;"><strong>Date:</strong> ${escapeHtml(dateLabel)}</p>
      <p style="margin:0 0 16px 0; font-family:Arial, Helvetica, sans-serif; font-size:14px; line-height:1.6; color:#0A1628;">Review the ${buildLegalLinksHtml()}.</p>
      ${buildEmailButton(confirmLabel, confirmUrl)}
      <p style="margin:20px 0 0 0; font-family:Arial, Helvetica, sans-serif; font-size:13px; line-height:1.6; color:#6B7280;">Didn&apos;t do this? Reply to this email and I will take care of it.</p>`;

  const text =
    audience === "parent_account_holder"
      ? `Confirm your email to finish setting up ${playerFirstName}'s account

Player: ${params.playerName?.trim() || params.playerEmail}
Agreed by: ${params.agreedByName}
Date: ${dateLabel}

${buildLegalLinksText()}

Confirm: ${confirmUrl}

Didn't do this? Reply to this email and I will take care of it.

${buildEmailFooterText()}`
      : `Please confirm ${playerFirstName}'s LCB Training agreement

Player: ${params.playerName?.trim() || params.playerEmail}
Agreed by: ${params.agreedByName}
Date: ${dateLabel}

${buildLegalLinksText()}

Confirm: ${confirmUrl}

Didn't do this? Reply to this email and I will take care of it.

${buildEmailFooterText()}`;

  return {
    subject,
    html: buildMemberEmailHtml({ title: subject, bodyContentHtml }),
    text,
  };
}
