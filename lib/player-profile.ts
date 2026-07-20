export const PLAYER_POSITIONS = [
  "Pitcher",
  "Catcher",
  "First Base",
  "Second Base",
  "Shortstop",
  "Third Base",
  "Left Field",
  "Center Field",
  "Right Field",
  "Utility",
  "Multiple Positions",
] as const;

export const PLAYER_LEVELS = [
  "Youth Rec",
  "Travel Ball",
  "Middle School",
  "High School JV",
  "High School Varsity",
  "College",
  "Post-College",
] as const;

export type PlayerPosition = (typeof PLAYER_POSITIONS)[number];
export type PlayerLevel = (typeof PLAYER_LEVELS)[number];

export function getGraduationYearOptions(referenceDate = new Date()) {
  const currentYear = referenceDate.getFullYear();
  return Array.from({ length: 9 }, (_, index) => currentYear + index);
}

export function isPlayerPosition(value: string): value is PlayerPosition {
  return PLAYER_POSITIONS.includes(value as PlayerPosition);
}

export function isPlayerLevel(value: string): value is PlayerLevel {
  return PLAYER_LEVELS.includes(value as PlayerLevel);
}

export function splitFullName(name: string | null | undefined) {
  const trimmed = name?.trim() ?? "";
  if (!trimmed) {
    return { firstName: "", lastName: "" };
  }

  const parts = trimmed.split(/\s+/);
  return {
    firstName: parts[0] ?? "",
    lastName: parts.slice(1).join(" "),
  };
}

export function combineFullName(firstName: string, lastName: string) {
  return [firstName.trim(), lastName.trim()].filter(Boolean).join(" ");
}

export type MemberProfileDetails = {
  position: string | null;
  age: number | null;
  graduationYear: number | null;
  currentTeam: string | null;
  level: string | null;
  playerBio: string | null;
};

export function serializeMemberProfile(profile: MemberProfileDetails | null | undefined) {
  if (!profile) {
    return {
      hasProfile: false,
      position: null,
      age: null,
      graduationYear: null,
      currentTeam: null,
      level: null,
      playerBio: null,
    };
  }

  const hasProfile = Boolean(
    profile.position ||
      profile.age ||
      profile.graduationYear ||
      profile.currentTeam ||
      profile.level ||
      profile.playerBio,
  );

  return {
    hasProfile,
    position: profile.position,
    age: profile.age,
    graduationYear: profile.graduationYear,
    currentTeam: profile.currentTeam,
    level: profile.level,
    playerBio: profile.playerBio,
  };
}

export const memberProfileSelect = {
  position: true,
  age: true,
  graduationYear: true,
  currentTeam: true,
  level: true,
  playerBio: true,
} as const;
