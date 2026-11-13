import type { FreeSwingAnalysisResponseMode } from "@/lib/free-swing-analysis-response-shared";

export type FreeSwingLandingStep = {
  title: string;
  body: string;
};

export type FreeSwingLandingCopy = {
  mode: FreeSwingAnalysisResponseMode;
  headline: string;
  intro: string;
  ctaLabel: string;
  steps: FreeSwingLandingStep[];
  sampleHeading: string;
  sampleBody: string;
  sampleCaption: string;
  seoTitle: string;
  seoDescription: string;
};

const VIDEO_COPY: FreeSwingLandingCopy = {
  mode: "VIDEO",
  headline: "Get a Free Video Swing Breakdown from Coach Broc",
  intro:
    "Send me your swing. I will walk through it on video, tell you what to fix first, and give you drills to work on between lessons and practices.",
  ctaLabel: "Get My Free Breakdown",
  steps: [
    {
      title: "Create a free account",
      body: "Sign up in under a minute. No credit card. Your free video breakdown is waiting after you log in.",
    },
    {
      title: "Film 2-3 swings from the side",
      body: "Capture a clear side view so I can see your load, path, and finish. Phone video is fine. Then upload them in the app.",
    },
    {
      title: "Get a personal video breakdown from Coach Broc",
      body: "I walk through your swing on video and give you drills to fix it.",
    },
  ],
  sampleHeading: "See How I Coach",
  sampleBody: "A real video breakdown I sent a player. Every breakdown is built for that player.",
  sampleCaption: "A real breakdown I sent a player.",
  seoTitle: "Get a Free Video Swing Breakdown from Coach Broc",
  seoDescription:
    "Send Coach Broc 2-3 side-view swings and get a personal video breakdown with drills. Free for baseball and softball players youth through college.",
};

const WRITTEN_COPY: FreeSwingLandingCopy = {
  mode: "WRITTEN_REPORT",
  headline: "Get a Free Swing Report from Coach Broc",
  intro:
    "Send me your swing. I will tell you what to fix first and give you drills to work on between lessons and practices.",
  ctaLabel: "Get My Free Report",
  steps: [
    {
      title: "Create a free account",
      body: "Sign up in under a minute. No credit card. Your free swing report is waiting after you log in.",
    },
    {
      title: "Film 2-3 swings from the side",
      body: "Capture a clear side view so I can see your load, path, and finish. Phone video is fine.",
    },
    {
      title: "Get written feedback and drills",
      body: "I review your swings personally and send written notes plus drills you can use right away.",
    },
  ],
  sampleHeading: "A look at the report",
  sampleBody: "You get a clear written breakdown in the app, not a generic tip sheet.",
  sampleCaption: "Sample in-app swing report",
  seoTitle: "Get a Free Swing Report from Coach Broc",
  seoDescription:
    "Send Coach Broc 2-3 side-view swings and get written feedback plus drills. Free for baseball and softball players youth through college.",
};

export const FREE_SWING_REPORT_SCREENSHOT_SRC = "/images/app-preview/swing-report-app.webp";

export function getFreeSwingLandingCopy(
  mode: FreeSwingAnalysisResponseMode,
): FreeSwingLandingCopy {
  return mode === "WRITTEN_REPORT" ? WRITTEN_COPY : VIDEO_COPY;
}
