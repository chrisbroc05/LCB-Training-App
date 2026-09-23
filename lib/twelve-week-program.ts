import { getCalendlyBookingUrl } from "@/lib/calendly-booking";

export const TWELVE_WEEK_PROGRAM_NAME = "12-Week Coaching Program";

export const TWELVE_WEEK_PROGRAM_PRICE_LABEL = "$599";

export const TWELVE_WEEK_PROGRAM_DURATION_WEEKS = 12;

export function getTwelveWeekProgramCheckInCalendlyUrl() {
  return getCalendlyBookingUrl();
}

export const twelveWeekProgramIncludes = [
  "Full access to The Next Level Playbook content library",
  "Unlimited swing and mental game submissions with personal feedback from Coach Broc",
  "Downloadable workout programs and training resources",
  "Weekly check-in calls with Coach Broc",
  "Weekly goal setting and progress check-ins to keep you on track",
  "Direct access to Coach Broc between sessions—your coach in your corner every day, not just on lesson days",
];

export const twelveWeekProgramLandingHighlights = [
  "The complete Playbook content library",
  "Unlimited swing and mental game submissions with personal feedback",
  "Downloadable workout programs",
  "Weekly check-in calls with Coach Broc",
  "Weekly goal setting and progress check-ins to keep you on track",
  "Direct access to Coach Broc between sessionsyour coach in your corner every day, not just on lesson days",
];

export function getTwelveWeekProgramEndDate(startDate: Date) {
  const endDate = new Date(startDate);
  endDate.setUTCDate(endDate.getUTCDate() + TWELVE_WEEK_PROGRAM_DURATION_WEEKS * 7);
  return endDate;
}

export function isTwelveWeekProgramActive(
  membershipTier: string,
  programEndsAt: Date | null | undefined,
  now = new Date(),
) {
  if (membershipTier !== "TWELVE_WEEK") {
    return false;
  }

  if (!programEndsAt) {
    return true;
  }

  return programEndsAt.getTime() >= now.getTime();
}
