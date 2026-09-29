import { getPublicAppUrl } from "@/lib/email-layout";
import { PLAYBOOK_NAME } from "@/lib/playbook-branding";
import { REMOTE_SESSION_PRICE } from "@/lib/remote-session-branding";
import {
  TWELVE_WEEK_PROGRAM_NAME,
  TWELVE_WEEK_PROGRAM_PRICE_LABEL,
} from "@/lib/twelve-week-program";

export const MARKETING_EMAIL_TYPES = [
  "WELCOME",
  "FREE_SUBMISSION_REMINDER",
  "FOLLOWUP_DRILLS_DAY_2",
  "FOLLOWUP_OTHER_SIX_DAY_4",
  "FOLLOWUP_SAMPLE_DAY_DAY_7",
  "FOLLOWUP_KNOWN_FOR_DAY_10",
] as const;

export type MarketingEmailTypeValue = (typeof MARKETING_EMAIL_TYPES)[number];

export const MARKETING_EMAIL_LABELS: Record<MarketingEmailTypeValue, string> = {
  WELCOME: "Welcome (signup)",
  FREE_SUBMISSION_REMINDER: "Free breakdown waiting (day 2 signup)",
  FOLLOWUP_DRILLS_DAY_2: "Follow-up day 2: Did you try the drills?",
  FOLLOWUP_OTHER_SIX_DAY_4: "Follow-up day 4: The other six days",
  FOLLOWUP_SAMPLE_DAY_DAY_7: "Follow-up day 7: Sample program day",
  FOLLOWUP_KNOWN_FOR_DAY_10: "Follow-up day 10: What do you want to be known for?",
};

export const FOLLOWUP_DAY_OFFSETS: Partial<Record<MarketingEmailTypeValue, number>> = {
  FOLLOWUP_DRILLS_DAY_2: 2,
  FOLLOWUP_OTHER_SIX_DAY_4: 4,
  FOLLOWUP_SAMPLE_DAY_DAY_7: 7,
  FOLLOWUP_KNOWN_FOR_DAY_10: 10,
};

export const MARKETING_EMAIL_WINDOWS: Partial<
  Record<MarketingEmailTypeValue, { minDays: number; maxDays: number }>
> = {
  FREE_SUBMISSION_REMINDER: { minDays: 2, maxDays: 3 },
  FOLLOWUP_DRILLS_DAY_2: { minDays: 2, maxDays: 3 },
  FOLLOWUP_OTHER_SIX_DAY_4: { minDays: 4, maxDays: 5 },
  FOLLOWUP_SAMPLE_DAY_DAY_7: { minDays: 7, maxDays: 8 },
  FOLLOWUP_KNOWN_FOR_DAY_10: { minDays: 10, maxDays: 11 },
};

const DAY_MS = 24 * 60 * 60 * 1000;

export function getMarketingEmailAgeDays(anchorDate: Date, now = new Date()) {
  return Math.floor((now.getTime() - anchorDate.getTime()) / DAY_MS);
}

export function isMarketingEmailInWindow(
  type: MarketingEmailTypeValue,
  anchorDate: Date,
  now = new Date(),
) {
  const window = MARKETING_EMAIL_WINDOWS[type];
  if (!window) {
    return false;
  }

  const ageDays = getMarketingEmailAgeDays(anchorDate, now);
  return ageDays >= window.minDays && ageDays <= window.maxDays;
}

export function formatMarketingEmailWindow(type: MarketingEmailTypeValue) {
  const window = MARKETING_EMAIL_WINDOWS[type];
  if (!window) {
    return "";
  }

  if (window.minDays === window.maxDays) {
    return `day ${window.minDays}`;
  }

  return `days ${window.minDays}-${window.maxDays}`;
}

export function getMarketingProgramUrl() {
  return `${getPublicAppUrl()}/program`;
}

export function getMarketingPlaybookUrl() {
  return `${getPublicAppUrl()}/upgrade`;
}

export function getMarketingSwingAnalysisUrl() {
  return `${getPublicAppUrl()}/swing-analysis`;
}

export function getMarketingMentalGameUrl() {
  return `${getPublicAppUrl()}/mental-game`;
}

export function getMarketingRemoteSessionUrl() {
  return `${getPublicAppUrl()}/remote`;
}

export function getMarketingCoachingSubmissionsUrl() {
  return `${getPublicAppUrl()}/coaching-submissions`;
}

export function getMarketingProfileUrl() {
  return `${getPublicAppUrl()}/profile`;
}

export function getMarketingSettingsNotificationsUrl() {
  return `${getPublicAppUrl()}/settings`;
}

export function buildSubmissionBreakdownUrl(params: {
  submissionType: "SWING" | "MENTAL";
  submissionId: string;
}) {
  const type = params.submissionType === "SWING" ? "swing" : "mental";
  return `${getPublicAppUrl()}/profile?type=${type}&id=${params.submissionId}`;
}

export function getTwelveWeekOfferLine() {
  return `${TWELVE_WEEK_PROGRAM_NAME}, ${TWELVE_WEEK_PROGRAM_PRICE_LABEL} one time`;
}

export function getPlaybookOfferLine() {
  return `${PLAYBOOK_NAME}, $59`;
}

export function getRemoteSessionOfferLine() {
  return `Remote Session, $${REMOTE_SESSION_PRICE}`;
}

export function getInPersonLessonsLine() {
  return "In-person lessons in Palatine (reply to this email to book)";
}

export function isMarketingEmailType(value: string): value is MarketingEmailTypeValue {
  return (MARKETING_EMAIL_TYPES as readonly string[]).includes(value);
}
