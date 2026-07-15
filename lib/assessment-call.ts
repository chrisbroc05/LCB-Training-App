export function formatAssessmentCallDateTime(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function parseAssessmentCallDateTime(callDate: string, callTime: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(callDate) || !/^\d{2}:\d{2}$/.test(callTime)) {
    return null;
  }

  const parsed = new Date(`${callDate}T${callTime}:00`);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}
