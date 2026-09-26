import {
  allDrillLibraryVideos,
  getDrillLibraryVideoId,
  type DrillLibraryVideoItem,
} from "@/lib/drill-library-videos";
import type { ProgramContentPhase } from "@/lib/program-content";

export type ProgramDrillRef = {
  title: string;
  vimeoId: string;
  href: string;
};

const drillByTitle = new Map<string, DrillLibraryVideoItem>();

for (const video of allDrillLibraryVideos) {
  drillByTitle.set(video.title, video);
}

function requireDrillTitle(title: string): ProgramDrillRef {
  const video = drillByTitle.get(title);
  if (!video) {
    throw new Error(`Program drill tag not found in drill library: "${title}"`);
  }

  const vimeoId = getDrillLibraryVideoId(video);
  if (!vimeoId) {
    throw new Error(`Program drill tag missing Vimeo id: "${title}"`);
  }

  return {
    title: video.title,
    vimeoId,
    href: `/drill-library?drill=${vimeoId}`,
  };
}

function resolveDrillTitles(titles: string[]) {
  return titles.map((title) => requireDrillTitle(title));
}

function rotatePick<T>(items: T[], startIndex: number, count: number) {
  if (items.length === 0) {
    return [] as T[];
  }

  const picked: T[] = [];
  for (let index = 0; index < Math.min(count, items.length); index += 1) {
    picked.push(items[(startIndex + index) % items.length]);
  }

  return picked;
}

export const HITTING_DRILLS_BY_WEEK: Record<number, string[]> = {
  1: ["Posture work", "Staying Stacked in Our Back Leg"],
  2: ["Coil into your load", "Don't drift in your load"],
  3: ["Staying Stacked in Our Back Leg", "Don't drift in your load"],
  4: [
    "Slot position",
    "Lead arm drill",
    "Half Bat Drill",
    "Stop casting your hands",
    "Top Hand - High Tee Drill",
    "PVC Pipe/Light Bat Swings",
  ],
  5: ["45 Degree Angled In", "Stop casting your hands"],
  6: ["45 Degree Drill - Angled Out", "Low Tee - Outside Pitch"],
  7: ["Top Hand - High Tee Drill", "Med ball & tee combo #1", "Med ball & tee combo #2"],
  8: [],
  9: ["PVC Pipe/Light Bat Swings"],
  10: [],
  11: ["Be Able to Hit These 3 Pitches"],
  12: ["Be Able to Hit These 3 Pitches"],
};

const FIELDING_ALWAYS_ON = ["Daily Progressions", "Do these everyday", "Quick Feet Drill"];

const FIELDING_WEEK_ONE_FIRST = ["How These Drills Translate to the Game"];

const FIELDING_FOUNDATION = [
  "Daily Progressions (Short Hops)",
  "4 drills you can do with just a glove, ball and bucket",
  "Forehand Footwork",
  "Backhand Footwork",
  "Backhand Footwork Drill",
  "3 drills to improve footwork and timing",
  "Fielding Timing",
];

const FIELDING_BUILD = [
  "Fielding Timing (2 Cones)",
  "Backhand Progression (2 Cones)",
  "Backhand Timing Drill (One Cone)",
  "Getting Around the Baseball Drill",
  "Timing and getting around the baseball",
];

const FIELDING_COMPETE = ["Body control", "Make plays on the run"];

export const MINDSET_DRILLS_BY_WEEK: Record<number, string[]> = {
  1: ["You Don't Have to Be the Biggest Player on the Team"],
  2: ["Develop Consistency and Discipline", "Take Your Mobility Serious"],
  3: [],
  4: ["Put the Work In"],
  5: ["Don't Worry About Mechanics in the Game"],
  6: ["Dominate the Level You're At Right Now"],
  7: [],
  8: ["Clear Your Mind", "Don't Make This Game Harder Than It Needs to Be"],
  9: ["Ask Questions and Be Curious"],
  10: ["Take Pride in Failure"],
  11: [],
  12: ["Trust the Training"],
};

export function getHittingDrillsForDay(weekNumber: number, dayOfWeek: number) {
  const titles = HITTING_DRILLS_BY_WEEK[weekNumber] ?? [];
  if (titles.length === 0) {
    return [];
  }

  const startIndex = (weekNumber + dayOfWeek) % titles.length;
  return resolveDrillTitles(rotatePick(titles, startIndex, 3));
}

export function getFieldingDrillsForDay(
  phase: ProgramContentPhase,
  weekNumber: number,
  dayOfWeek: number,
) {
  const phaseTitles =
    phase === "foundation"
      ? FIELDING_FOUNDATION
      : phase === "build"
        ? FIELDING_BUILD
        : FIELDING_COMPETE;

  const pool = [...FIELDING_ALWAYS_ON, ...phaseTitles];
  if (weekNumber === 1) {
    pool.unshift(...FIELDING_WEEK_ONE_FIRST);
  }

  const startIndex = (weekNumber * 2 + dayOfWeek) % pool.length;
  return resolveDrillTitles(rotatePick(pool, startIndex, 3));
}

export function getMindsetDrillsForDay(weekNumber: number, dayOfWeek: number) {
  const titles = MINDSET_DRILLS_BY_WEEK[weekNumber] ?? [];
  if (titles.length === 0) {
    return [];
  }

  const startIndex = dayOfWeek % titles.length;
  return resolveDrillTitles(rotatePick(titles, startIndex, 3));
}
