import { getCoachCalendlyUrl } from "@/lib/coach-calendly-shared";
import { getDateForProgramDay, PROGRAM_DAY_COUNT } from "@/lib/program-schedule";
import { TWELVE_WEEK_KICKOFF_AND_CHECKINS_LINE } from "@/lib/twelve-week-program-copy-shared";

export const TWELVE_WEEK_PROGRAM_NAME = "12-Week Coaching Program";

export const TWELVE_WEEK_PROGRAM_PRICE_LABEL = "$599";

export const TWELVE_WEEK_PROGRAM_DURATION_WEEKS = 12;

export function getTwelveWeekProgramCheckInCalendlyUrl() {
  return getCoachCalendlyUrl();
}

export const twelveWeekProgramIncludes = [
  "Full access to The Next Level Playbook content library",
  "Unlimited swing and mental game submissions with personal feedback from Coach Broc",
  "Downloadable workout programs and training resources",
  TWELVE_WEEK_KICKOFF_AND_CHECKINS_LINE,
  "Weekly goal setting and progress check-ins to keep you on track",
  "Direct access to Coach Broc between sessions, your coach in your corner every day, not just on lesson days",
];

export const twelveWeekProgramLandingHighlights = [
  "The complete Playbook content library",
  "Unlimited swing and mental game submissions with personal feedback",
  "Downloadable workout programs",
  TWELVE_WEEK_KICKOFF_AND_CHECKINS_LINE,
  "Weekly goal setting and progress check-ins to keep you on track",
  "Direct access to Coach Broc between sessions, your coach in your corner every day, not just on lesson days",
];

export function getTwelveWeekProgramEndDate(startDate: Date) {
  return getDateForProgramDay(startDate, PROGRAM_DAY_COUNT);
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
