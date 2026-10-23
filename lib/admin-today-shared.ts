export type AdminTodayAttention = {
  goneQuietCount: number;
  waitingOnSetupCount: number;
  pendingGoalCheckinsCount: number;
  unconfirmedMinorsCount: number;
  unconfirmedMinorNames: string[];
  total: number;
};

export type AdminTodaySnapshot = {
  videoReviewsWaiting: number;
  writtenReportsWaiting: number;
  unreadMessagesCount: number;
  leadsTodayCount: number;
  checkoutsStartedOpenCount: number;
  salesTodayCount: number;
  attention: AdminTodayAttention;
};
