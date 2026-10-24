export type AdminTodayCoachingLoad = {
  weekLabel: string;
  videoReviewsSent: number;
  writtenReportsSent: number;
  averageTurnaroundHours: number | null;
  reportsOpeningNext7Days: number;
  pendingWrittenReports: number;
  thisWeekTotalSent: number;
  lastWeekTotalSent: number;
};

export type AdminTodayGrowthDayPoint = {
  dateKey: string;
  shortLabel: string;
  value: number;
};

export type AdminTodayGrowthSeries = {
  days: AdminTodayGrowthDayPoint[];
  totalCurrent: number;
  totalPrevious: number;
  changePercent: number | null;
};

export type AdminTodayGrowth = {
  leads: AdminTodayGrowthSeries;
  accounts: AdminTodayGrowthSeries;
  salesDollars: AdminTodayGrowthSeries;
};

export type AdminTodayComingUpRow = {
  id: string;
  title: string;
  subtitle: string;
  href: string;
};

export type AdminTodayComingUp = {
  orgTrialsEnding: AdminTodayComingUpRow[];
  twelveWeekStartOrFinish: AdminTodayComingUpRow[];
  coreReportsDue: AdminTodayComingUpRow[];
  unconfirmedMinors: AdminTodayComingUpRow[];
};

export type AdminTodayInsights = {
  coachingLoad: AdminTodayCoachingLoad;
  growth: AdminTodayGrowth;
  comingUp: AdminTodayComingUp;
};
