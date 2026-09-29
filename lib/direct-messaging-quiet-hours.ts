import { getChicagoDateTimeParts } from "@/lib/program-email-chicago";

export function isPlayerPushQuietHours(now = new Date()) {
  const { hour } = getChicagoDateTimeParts(now);
  return hour >= 21 || hour < 7;
}

export function isMorningPlayerPushWindow(now = new Date()) {
  const { hour } = getChicagoDateTimeParts(now);
  return hour >= 7 && hour < 12;
}
