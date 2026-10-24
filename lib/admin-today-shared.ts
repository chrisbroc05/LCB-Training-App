export type AdminTodayAttention = {
  goneQuietCount: number;
  waitingOnSetupCount: number;
  pendingGoalCheckinsCount: number;
  unconfirmedMinorsCount: number;
  unconfirmedMinorNames: string[];
  total: number;
};

import type { AdminTodayInsights } from "@/lib/admin-today-insights-shared";

export type AdminTodaySnapshot = {
  videoReviewsWaiting: number;
  writtenReportsWaiting: number;
  unreadMessagesCount: number;
  leadsTodayCount: number;
  checkoutsStartedOpenCount: number;
  salesTodayCount: number;
  attention: AdminTodayAttention;
  insights: AdminTodayInsights;
};
