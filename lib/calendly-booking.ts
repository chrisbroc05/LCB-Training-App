const DEFAULT_CALENDLY_BOOKING_URL =
  "https://calendly.com/chrisbroc05/remote-training-session";

export function getCalendlyBookingUrl() {
  const configuredUrl = process.env.CALENDLY_BOOKING_URL?.trim();
  return configuredUrl || DEFAULT_CALENDLY_BOOKING_URL;
}
