export type DrillLibraryVideoItem = {
  title: string;
  url: string;
  category: "hitting" | "fielding" | "mindset";
};

type DrillLibraryVideoSource = {
  title: string;
  url: string;
};

const hittingVideoSources: DrillLibraryVideoSource[] = [
  { title: "Coil into your load", url: "https://player.vimeo.com/video/1200422510" },
  { title: "Recreate this feeling", url: "https://player.vimeo.com/video/1200422513" },
  { title: "Med ball & tee combo #1", url: "https://player.vimeo.com/video/1200422511" },
  { title: "Med ball & tee combo #2", url: "https://player.vimeo.com/video/1200422512" },
  { title: "Stop casting your hands", url: "https://player.vimeo.com/video/1200422514" },
  { title: "Lead arm drill", url: "https://player.vimeo.com/video/1200422515" },
  { title: "Slot position", url: "https://player.vimeo.com/video/1200422517" },
  { title: "Posture work", url: "https://player.vimeo.com/video/1200422516" },
  { title: "Don't drift in your load", url: "https://player.vimeo.com/video/1200422500" },
  { title: "PVC Pipe/Light Bat Swings", url: "https://player.vimeo.com/video/1207507965" },
  { title: "Top Hand - High Tee Drill", url: "https://player.vimeo.com/video/1207509269" },
  { title: "Half Bat Drill", url: "https://player.vimeo.com/video/1207510044" },
  { title: "Low Tee - Outside Pitch", url: "https://player.vimeo.com/video/1207511052" },
  { title: "45 Degree Angled In", url: "https://player.vimeo.com/video/1207512012" },
  { title: "45 Degree Drill - Angled Out", url: "https://player.vimeo.com/video/1207513205" },
  {
    title: "Staying Stacked in Our Back Leg",
    url: "https://player.vimeo.com/video/1207514238",
  },
  {
    title: "Be Able to Hit These 3 Pitches",
    url: "https://player.vimeo.com/video/1207516198",
  },
];

const fieldingVideoSources: DrillLibraryVideoSource[] = [
  { title: "Do these everyday", url: "https://player.vimeo.com/video/1200425708" },
  {
    title: "4 drills you can do with just a glove, ball and bucket",
    url: "https://player.vimeo.com/video/1200425698",
  },
  { title: "Make plays on the run", url: "https://player.vimeo.com/video/1200425704" },
  { title: "Body control", url: "https://player.vimeo.com/video/1200425706" },
  {
    title: "Timing and getting around the baseball",
    url: "https://player.vimeo.com/video/1200425705",
  },
  {
    title: "3 drills to improve footwork and timing",
    url: "https://player.vimeo.com/video/1200425707",
  },
  { title: "Daily Progressions", url: "https://player.vimeo.com/video/1205918751" },
  {
    title: "Daily Progressions (Short Hops)",
    url: "https://player.vimeo.com/video/1205918743",
  },
  { title: "Forehand Footwork", url: "https://player.vimeo.com/video/1205921603" },
  { title: "Fielding Timing (2 Cones)", url: "https://player.vimeo.com/video/1205921606" },
  {
    title: "Backhand Progression (2 Cones)",
    url: "https://player.vimeo.com/video/1205921604",
  },
  { title: "Fielding Timing", url: "https://player.vimeo.com/video/1205921593" },
  {
    title: "Backhand Timing Drill (One Cone)",
    url: "https://player.vimeo.com/video/1205921605",
  },
  {
    title: "How These Drills Translate to the Game",
    url: "https://player.vimeo.com/video/1205924083",
  },
  { title: "Backhand Footwork", url: "https://player.vimeo.com/video/1205924081" },
  {
    title: "Getting Around the Baseball Drill",
    url: "https://player.vimeo.com/video/1205924082",
  },
  { title: "Quick Feet Drill", url: "https://player.vimeo.com/video/1205924080" },
  { title: "Backhand Footwork Drill", url: "https://player.vimeo.com/video/1205924073" },
];

const mindsetVideoSources: DrillLibraryVideoSource[] = [
  { title: "Take Your Mobility Serious", url: "https://player.vimeo.com/video/1210519237" },
  {
    title: "You Don't Have to Be the Biggest Player on the Team",
    url: "https://player.vimeo.com/video/1210519236",
  },
  { title: "Ask Questions and Be Curious", url: "https://player.vimeo.com/video/1210519239" },
  {
    title: "Dominate the Level You're At Right Now",
    url: "https://player.vimeo.com/video/1210519241",
  },
  { title: "Put the Work In", url: "https://player.vimeo.com/video/1210519240" },
  {
    title: "Don't Worry About Mechanics in the Game",
    url: "https://player.vimeo.com/video/1210519242",
  },
  {
    title: "Develop Consistency and Discipline",
    url: "https://player.vimeo.com/video/1210519238",
  },
  { title: "Clear Your Mind", url: "https://player.vimeo.com/video/1210519230" },
  { title: "Take Pride in Failure", url: "https://player.vimeo.com/video/1210521781" },
  { title: "Trust the Training", url: "https://player.vimeo.com/video/1210521780" },
  {
    title: "Don't Make This Game Harder Than It Needs to Be",
    url: "https://player.vimeo.com/video/1210521772",
  },
];

export const hittingVideos: DrillLibraryVideoItem[] = hittingVideoSources.map((video) => ({
  ...video,
  category: "hitting" as const,
}));

export const fieldingVideos: DrillLibraryVideoItem[] = fieldingVideoSources.map((video) => ({
  ...video,
  category: "fielding" as const,
}));

export const mindsetVideos: DrillLibraryVideoItem[] = mindsetVideoSources.map((video) => ({
  ...video,
  category: "mindset" as const,
}));

export const allDrillLibraryVideos: DrillLibraryVideoItem[] = [
  ...hittingVideos,
  ...fieldingVideos,
  ...mindsetVideos,
];

export function extractVimeoVideoId(url: string) {
  const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
  return match?.[1] ?? null;
}
