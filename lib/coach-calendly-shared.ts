export const COACH_CALENDLY_URL =
  "https://calendly.com/chrisbroc05/talk-with-coach-broc";

export function getCoachCalendlyUrl() {
  const configuredUrl =
    typeof process !== "undefined" ? process.env.CALENDLY_BOOKING_URL?.trim() : "";
  return configuredUrl || COACH_CALENDLY_URL;
}
