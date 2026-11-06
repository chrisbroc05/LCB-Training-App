import type { MarketingEmailTypeValue } from "@/lib/marketing-email-shared";

/** Stable subject lines for marketing pipeline emails (logged in MarketingEmailLog.subject). */
export function getMarketingEmailSubjectLine(type: MarketingEmailTypeValue): string {
  switch (type) {
    case "WELCOME":
      return "Welcome to LCB Training";
    case "FREE_SUBMISSION_REMINDER":
      return "Your free breakdown is waiting";
    case "ORG_TRIAL_SUBMISSION_REMINDER":
      return "Your swing report from Coach Broc is waiting";
    case "FOLLOWUP_DRILLS_DAY_2":
      return "Did you try the drills?";
    case "FOLLOWUP_OTHER_SIX_DAY_4":
      return "Lessons are one day a week. What happens the other six?";
    case "FOLLOWUP_SAMPLE_DAY_DAY_7":
      return "What a day in the program looks like";
    case "FOLLOWUP_KNOWN_FOR_DAY_10":
      return "What do you want to be known for?";
    case "MEMBERSHIP_LEVEL_WELCOME":
    case "TWELVE_WEEK_PROGRAM_WELCOME":
      return "(transactional; subject varies)";
    default: {
      const _exhaustive: never = type;
      return String(_exhaustive);
    }
  }
}
