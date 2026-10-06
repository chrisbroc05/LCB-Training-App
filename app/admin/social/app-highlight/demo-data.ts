import type { MessageChatItem } from "@/components/MessageChatView";

export const DEMO_PLAYER_NAME = "Jake";
export const DEMO_WEEK_NUMBER = 4;

export const DEMO_WEEK_FOCUS_CUE = "Swing path through the middle";
export const DEMO_WEEK_FOCUS_NOTE =
  "Stay through the middle of the field this week. Short to the ball, barrel stays inside, finish high.";

export const DEMO_CHAT_MESSAGES: MessageChatItem[] = [
  {
    id: "1",
    body: "Coach, my front foot keeps drifting open on outside pitches.",
    fromCoach: false,
    createdAt: "2026-03-18T16:05:00.000Z",
    readAt: "2026-03-18T16:06:00.000Z",
  },
  {
    id: "2",
    body: "Good catch. Think closed landing and let the hands work late. I dropped a cue video for you.",
    fromCoach: true,
    createdAt: "2026-03-18T16:12:00.000Z",
    readAt: null,
  },
  {
    id: "3",
    body: "Got it. I'll hit the slot drill before tonight's session.",
    fromCoach: false,
    createdAt: "2026-03-18T16:18:00.000Z",
    readAt: "2026-03-18T16:19:00.000Z",
  },
];

export const DEMO_BREAKDOWN_RESPONSE = {
  title: "Coach Broc's Breakdown",
  summary:
    "Your load is clean, but the barrel leaks early on middle-away. Stay stacked, let the ball travel, and drive it back up the middle.",
  drills: ["Staying connected", "Slot position", "Stop casting your hands"],
};

export const DEMO_WORKOUT = {
  title: "Strength Workout A",
  subtitle: "Lower Body and Power",
  items: [
    { label: "Bodyweight squat", detail: "3 x 15" },
    { label: "Goblet squat", detail: "3 x 10" },
    { label: "DB Romanian deadlift", detail: "3 x 10" },
    { label: "90/90 hip switches", detail: "2 x 8 each side" },
    { label: "Dead bug", detail: "2 x 8 each side" },
  ],
};

export const DEMO_SEASON_STATS = {
  games: 6,
  avg: ".318",
  obp: ".419",
  hits: 14,
  rbis: 9,
  stolenBases: 4,
};

export const DEMO_GAME_LOG = {
  opponent: "Central HS",
  line: "2-3, 2B, RBI, R",
  note: "Stayed on middle-away and drove a ball the other way.",
};

export const DEMO_PARENT_RECAP_PARAMS = {
  playerFirstName: DEMO_PLAYER_NAME,
  weekNumber: DEMO_WEEK_NUMBER,
  tasksCompleted: 18,
  tasksTotal: 21,
  streak: 5,
  daysFullyDone: 5,
  gamesAndPractices: ["Game vs Central HS: 2-3, 2B, RBI", "Practice: front toss focus"],
  weekFocus: DEMO_WEEK_FOCUS_CUE,
  weekFocusNote: DEMO_WEEK_FOCUS_NOTE,
  weeklyVideoSent: true,
  bestNotes: ["Best barrel feel on middle-away.", "Fielding footwork felt quicker."],
  nextWeekPhase: "Build",
  messagesThisWeek: 3,
  coachVideosThisWeek: 1,
  parentMessagesUrl: "https://lcbtraining.com/messages/parent",
  unsubscribeUrl: "https://lcbtraining.com/program/parent/unsubscribe",
};
