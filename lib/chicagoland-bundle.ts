import { getPlayerAssessmentCallCalendlyUrl } from "@/lib/assessment-call";

export const CHICAGOLAND_BUNDLE_HEADING = "Local to Chicagoland?";

export const CHICAGOLAND_BUNDLE_TEXT =
  "Ask about the Lessons + Program bundle: 12 in-person lessons in Palatine plus the full 12-Week Program for $999. Spots are limited by my lesson schedule.";

export const CHICAGOLAND_BUNDLE_EMAIL = "chrisbroc05@gmail.com";

export const CHICAGOLAND_BUNDLE_EMAIL_SUBJECT = "Lessons + Program bundle";

export const CHICAGOLAND_BUNDLE_SMS_NUMBER = "8472089661";

export function getChicagolandBundleCalendlyUrl() {
  return getPlayerAssessmentCallCalendlyUrl();
}

export function getChicagolandBundleEmailUrl() {
  const subject = encodeURIComponent(CHICAGOLAND_BUNDLE_EMAIL_SUBJECT);
  return `mailto:${CHICAGOLAND_BUNDLE_EMAIL}?subject=${subject}`;
}

export function getChicagolandBundleSmsUrl() {
  return `sms:${CHICAGOLAND_BUNDLE_SMS_NUMBER}`;
}
