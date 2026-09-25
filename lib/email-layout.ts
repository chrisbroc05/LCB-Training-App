export type EmailTestimonial = {
  quote: string;
  name: string;
  detail: string;
};

export const EMAIL_TESTIMONIALS: readonly EmailTestimonial[] = [
  {
    quote:
      "I hit around .350 this year and batted leadoff for most of the season. That's way better than it was in the past. I'm definitely happy with the season, especially my hitting.",
    name: "",
    detail: "Varsity infielder, Class of 2026",
  },
  {
    quote:
      "After your lesson with my son, he was so excited. The next game he went 3 for 3, got in the car, and said, 'I did what Coach Chris taught me, and it worked.'",
    name: "",
    detail: "Parent of a 13U player",
  },
  {
    quote: "My team cannot stop talking about your training and would love to have you back again.",
    name: "",
    detail: "15U baseball coach",
  },
] as const;

export const EMAIL_REPLY_TO = "chrisbroc05@gmail.com";

export function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function getPublicAppUrl() {
  const appUrl = process.env.NEXTAUTH_URL?.replace(/\/$/, "");
  return appUrl && !appUrl.includes("localhost") ? appUrl : "https://lcbtraining.com";
}

export function buildEmailSectionLabel(label: string) {
  return `<p style="margin:28px 0 12px 0; font-family:Arial, Helvetica, sans-serif; font-size:12px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:#2D6A4F;">${escapeHtml(label)}</p>`;
}

export function buildEmailButton(label: string, href: string) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0 0 0;">
    <tr>
      <td align="center" bgcolor="#2D6A4F" style="border-radius:8px; background-color:#2D6A4F;">
        <a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer" style="display:inline-block; padding:14px 28px; font-family:Arial, Helvetica, sans-serif; font-size:16px; font-weight:700; color:#FFFFFF; text-decoration:none; border-radius:8px;">${escapeHtml(label)}</a>
      </td>
    </tr>
  </table>`;
}

export function buildEmailDivider() {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:24px 0;">
    <tr>
      <td style="height:2px; background-color:#52B788; font-size:0; line-height:0;">&nbsp;</td>
    </tr>
  </table>`;
}

export function buildEmailInfoBox(contentHtml: string) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse; background-color:#F4F6F8; border-radius:8px;">
    <tr>
      <td style="padding:16px;">
        ${contentHtml}
      </td>
    </tr>
  </table>`;
}

export function buildEmailTestimonialsHtml() {
  return EMAIL_TESTIMONIALS.map((entry) => {
    const nameLine = entry.name
      ? `<p style="margin:8px 0 0 0; font-family:Arial, Helvetica, sans-serif; font-size:13px; font-weight:700; color:#0A1628;">${escapeHtml(entry.name)}</p>`
      : "";

    return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 12px 0; border-collapse:collapse;">
      <tr>
        <td style="padding:16px; background-color:#F4F6F8; border-radius:8px;">
          <p style="margin:0; font-family:Arial, Helvetica, sans-serif; font-size:15px; line-height:1.6; font-style:italic; color:#0A1628;">"${escapeHtml(entry.quote)}"</p>
          ${nameLine}
          <p style="margin:8px 0 0 0; font-family:Arial, Helvetica, sans-serif; font-size:13px; font-weight:700; color:#2D6A4F;">${escapeHtml(entry.detail)}</p>
        </td>
      </tr>
    </table>`;
  }).join("");
}

export function buildEmailTestimonialsText() {
  return EMAIL_TESTIMONIALS.map((entry) => `"${entry.quote}"\n${entry.detail}`).join("\n\n");
}

export function buildEmailTestimonialsBlockHtml() {
  return `${buildEmailSectionLabel("WHAT PLAYERS AND PARENTS ARE SAYING")}
      ${buildEmailTestimonialsHtml()}`;
}

export function buildEmailTestimonialsBlockText() {
  return `\n\nWHAT PLAYERS AND PARENTS ARE SAYING\n${buildEmailTestimonialsText()}`;
}

type EmailProgramPitchVariant = "confirmation" | "response";

export function buildEmailProgramPitchHtml(params: {
  variant: EmailProgramPitchVariant;
  programUrl: string;
}) {
  const introParagraph =
    params.variant === "confirmation"
      ? `<p style="margin:0 0 12px 0; font-family:Arial, Helvetica, sans-serif; font-size:15px; line-height:1.7; color:#0A1628;">Lessons are one day a week. What happens the other six?</p>
      <p style="margin:0; font-family:Arial, Helvetica, sans-serif; font-size:15px; line-height:1.7; color:#0A1628;">My 12-Week Program puts me in your corner every day: a daily routine built for you, unlimited feedback on your swing and mindset, and weekly calls to keep you on track.</p>`
      : `<p style="margin:0 0 12px 0; font-family:Arial, Helvetica, sans-serif; font-size:15px; line-height:1.7; color:#0A1628;">You just got one breakdown. Imagine having me in your corner every day.</p>
      <p style="margin:0; font-family:Arial, Helvetica, sans-serif; font-size:15px; line-height:1.7; color:#0A1628;">The 12-Week Program gives you a daily routine built for you, unlimited feedback on your swing and mindset, and weekly calls to keep you on track. Lessons are one day a week. This is what happens the other six.</p>`;

  return `${buildEmailSectionLabel("THE OTHER SIX DAYS")}
      ${introParagraph}
      ${buildEmailButton("See the 12-Week Program", params.programUrl)}`;
}

export function buildEmailProgramPitchText(params: {
  variant: EmailProgramPitchVariant;
  programUrl: string;
}) {
  const body =
    params.variant === "confirmation"
      ? "Lessons are one day a week. What happens the other six?\nMy 12-Week Program puts me in your corner every day: a daily routine built for you, unlimited feedback on your swing and mindset, and weekly calls to keep you on track."
      : "You just got one breakdown. Imagine having me in your corner every day.\nThe 12-Week Program gives you a daily routine built for you, unlimited feedback on your swing and mindset, and weekly calls to keep you on track. Lessons are one day a week. This is what happens the other six.";

  return `\n\nTHE OTHER SIX DAYS\n${body}\nSee the 12-Week Program: ${params.programUrl}`;
}

export function buildEmailNonMemberUpsellHtml(params: {
  programPitchVariant: EmailProgramPitchVariant;
  programUrl: string;
}) {
  return `${buildEmailTestimonialsBlockHtml()}
      ${buildEmailProgramPitchHtml({ variant: params.programPitchVariant, programUrl: params.programUrl })}`;
}

export function buildEmailNonMemberUpsellText(params: {
  programPitchVariant: EmailProgramPitchVariant;
  programUrl: string;
}) {
  return `${buildEmailTestimonialsBlockText()}${buildEmailProgramPitchText({
    variant: params.programPitchVariant,
    programUrl: params.programUrl,
  })}`;
}

export function buildEmailHeaderHtml() {
  return `<tr>
            <td style="padding:28px 24px; background-color:#0A1628; border-radius:12px 12px 0 0; text-align:center;">
              <p style="margin:0 0 8px 0; font-family:Arial, Helvetica, sans-serif; font-size:24px; font-weight:700; letter-spacing:0.06em; color:#FFFFFF;">LCB TRAINING</p>
              <p style="margin:0; font-family:Arial, Helvetica, sans-serif; font-size:14px; color:#FFFFFF;">Work Hard. Be Memorable.</p>
            </td>
          </tr>`;
}

export function buildEmailFooterHtml() {
  return `${buildEmailDivider()}
              <p style="margin:0 0 8px 0; font-family:Arial, Helvetica, sans-serif; font-size:13px; line-height:1.6; color:#6B7280;">Coach Broc</p>
              <p style="margin:0 0 8px 0; font-family:Arial, Helvetica, sans-serif; font-size:13px; line-height:1.6; color:#6B7280;">LCB Training | lcbtraining.com</p>
              <p style="margin:0 0 8px 0; font-family:Arial, Helvetica, sans-serif; font-size:13px; line-height:1.6; color:#6B7280;">Instagram @lcbtraining | TikTok @cbroc05</p>
              <p style="margin:0; font-family:Arial, Helvetica, sans-serif; font-size:13px; line-height:1.6; color:#6B7280;">Questions? Just reply to this email.</p>`;
}

export function buildEmailFooterText() {
  return `Coach Broc
LCB Training | lcbtraining.com
Instagram @lcbtraining | TikTok @cbroc05
Questions? Just reply to this email.`;
}

export function buildMemberEmailHtml(params: { title: string; bodyContentHtml: string }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="color-scheme" content="light" />
<meta name="supported-color-schemes" content="light" />
<title>${escapeHtml(params.title)}</title>
</head>
<body style="margin:0; padding:0; background-color:#F4F6F8;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#F4F6F8; border-collapse:collapse;">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:600px; border-collapse:collapse;">
          ${buildEmailHeaderHtml()}
          <tr>
            <td style="padding:32px 24px; background-color:#FFFFFF; border-radius:0 0 12px 12px;">
              ${params.bodyContentHtml}
              ${buildEmailFooterHtml()}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function buildSubmissionResponseProfilePath(
  submissionType: "SWING_ANALYSIS" | "MENTAL_GAME",
  submissionId: string,
) {
  const type = submissionType === "SWING_ANALYSIS" ? "swing" : "mental";
  return `/profile?type=${type}&id=${submissionId}`;
}

export function buildSubmissionResponseUrl(
  submissionType: "SWING_ANALYSIS" | "MENTAL_GAME",
  submissionId: string,
) {
  return `${getPublicAppUrl()}${buildSubmissionResponseProfilePath(submissionType, submissionId)}`;
}

export function buildDrillLibraryUrl(drillId?: string) {
  const baseUrl = `${getPublicAppUrl()}/drill-library`;
  if (!drillId) {
    return baseUrl;
  }

  return `${baseUrl}?drill=${encodeURIComponent(drillId)}`;
}

export function buildAuthRedirectPath(targetPath: string) {
  return `/auth?redirect=${encodeURIComponent(targetPath)}`;
}
