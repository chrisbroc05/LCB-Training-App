export type AdminResourceStatsRange = "7" | "30" | "90" | "all";

export type AdminResourceStatsRow = {
  slug: string;
  title: string;
  tag: string;
  clicks: number;
  downloads: number;
  checkoutsStarted: number;
  purchases: number;
  revenueCents: number;
  conversionPercent: number | null;
};

export type AdminResourceClickRow = {
  leadId: string;
  name: string;
  role: string;
  clickedAt: string;
  purchased: boolean;
};

export function parseAdminResourceStatsRange(value: string | null): AdminResourceStatsRange {
  if (value === "7" || value === "30" || value === "90" || value === "all") {
    return value;
  }
  return "30";
}

export function rangeStartFromChoice(range: AdminResourceStatsRange, now = new Date()): Date | null {
  if (range === "all") {
    return null;
  }
  const days = Number(range);
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}
