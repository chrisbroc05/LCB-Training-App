/**
 * Add-on track definitions (client-safe: no server imports).
 */

export type ProgramTrackKey = "arm_care" | "catcher";

export type ProgramTrackExercise = {
  name: string;
  prescription: string;
  formCue: string;
  optional?: boolean;
};

export type ProgramTrackPhaseKey = "weeks1to4" | "weeks5to8" | "weeks9to12";

export type ProgramTrackDefinition = {
  key: ProgramTrackKey;
  label: string;
  description: string;
  /** Calendar weekdays when this track runs: 1=Mon ... 6=Sat */
  daysOfWeek: number[];
  minutesLabel: string;
  equipment: string;
  safetyNote: string;
  /** Shown on arm care tasks and in track description (plain text + URL). */
  equipmentNote?: string;
  equipmentNoteUrl?: string;
  /** Up to 2 drill-library vimeo ids recommended for this track */
  recommendedDrillVimeoIds?: string[];
  phases: Record<ProgramTrackPhaseKey, ProgramTrackExercise[]>;
};

export const PROGRAM_TRACK_KEYS: ProgramTrackKey[] = ["arm_care", "catcher"];

export function getTrackPhaseKey(weekNumber: number): ProgramTrackPhaseKey {
  if (weekNumber <= 4) {
    return "weeks1to4";
  }
  if (weekNumber <= 8) {
    return "weeks5to8";
  }
  return "weeks9to12";
}

export function buildTrackTaskKey(programDay: number, trackKey: ProgramTrackKey) {
  return `d${programDay}-track-${trackKey}`;
}

export function isTrackTaskKey(taskKey: string) {
  return /-track-arm_care$/.test(taskKey) || /-track-catcher$/.test(taskKey);
}

export function getProgramTrackDefinition(trackKey: string): ProgramTrackDefinition | null {
  return PROGRAM_TRACKS.find((track) => track.key === trackKey) ?? null;
}

export const ARM_CARE_EQUIPMENT_NOTE =
  "Best with a light band with handles (we recommend Jaeger Sports J-Bands, adult). A heavy loop band is fine for rows and pull-aparts, but skip the shoulder rotations until you have a light band.";

export const ARM_CARE_EQUIPMENT_URL =
  "https://www.baseballmonkey.com/jaeger-baseball-accessories-j-bands.html";

export const PROGRAM_TRACKS: ProgramTrackDefinition[] = [
  {
    key: "arm_care",
    label: "Arm Care",
    description: `${ARM_CARE_EQUIPMENT_NOTE} See ${ARM_CARE_EQUIPMENT_URL}`,
    daysOfWeek: [1, 3, 5, 6],
    minutesLabel: "10-12 min",
    equipment: "Resistance band, wall, light weight (water bottle)",
    safetyNote:
      "Stop if anything feels sharp or pinchy. Soreness is okay, pain is not. Never throw max effort through soreness. If you've had shoulder issues, check with your PT or doctor before starting.",
    equipmentNote: ARM_CARE_EQUIPMENT_NOTE,
    equipmentNoteUrl: ARM_CARE_EQUIPMENT_URL,
    phases: {
      weeks1to4: [
        {
          name: "Band pull-aparts",
          prescription: "2x15",
          formCue: "Stand tall, pull the band to your chest with straight wrists and squeeze your shoulder blades.",
        },
        {
          name: "Band external rotation at side (elbow 90, towel under arm)",
          prescription: "2x12 each arm",
          formCue: "Keep your elbow pinned at your side and rotate your forearm out without shrugging.",
        },
        {
          name: "Band internal rotation at side",
          prescription: "2x12 each arm",
          formCue: "Same setup as external rotation; rotate your forearm in with control, no trunk twist.",
        },
        {
          name: "Band rows",
          prescription: "2x15",
          formCue: "Pull your elbows back like starting a lawn mower; pause when your hands reach your ribs.",
        },
        {
          name: "Wall slides",
          prescription: "2x10",
          formCue: "Forearms on the wall, slide up and down while keeping your lower back flat to the wall.",
        },
        {
          name: "Open-book thoracic rotation",
          prescription: "1x8 each side",
          formCue: "On your side, open your top arm like a book and follow your hand with your eyes.",
        },
        {
          name: "Wrist curls with water bottle",
          prescription: "1x15",
          formCue: "Forearm on your knee, curl the bottle up using only your wrist, slow on the way down.",
        },
        {
          name: "Wrist extensions with water bottle",
          prescription: "1x15",
          formCue: "Same setup, raise the back of your hand toward the ceiling with a controlled tempo.",
        },
        {
          name: "Forearm rotations with water bottle",
          prescription: "1x15 each direction",
          formCue: "Hold the bottle vertical and rotate your forearm palm up and palm down without moving your elbow.",
        },
      ],
      weeks5to8: [
        {
          name: "Band pull-aparts",
          prescription: "3x15",
          formCue: "Stand tall, pull the band to your chest with straight wrists and squeeze your shoulder blades.",
        },
        {
          name: "Band external rotation at side (elbow 90, towel under arm)",
          prescription: "3x12 each arm",
          formCue: "Keep your elbow pinned at your side and rotate your forearm out without shrugging.",
        },
        {
          name: "Band internal rotation at side",
          prescription: "3x12 each arm",
          formCue: "Same setup as external rotation; rotate your forearm in with control, no trunk twist.",
        },
        {
          name: "Band rows",
          prescription: "3x15",
          formCue: "Pull your elbows back like starting a lawn mower; pause when your hands reach your ribs.",
        },
        {
          name: "Wall slides",
          prescription: "3x10",
          formCue: "Forearms on the wall, slide up and down while keeping your lower back flat to the wall.",
        },
        {
          name: "Open-book thoracic rotation",
          prescription: "1x8 each side",
          formCue: "On your side, open your top arm like a book and follow your hand with your eyes.",
        },
        {
          name: "Wrist curls with water bottle",
          prescription: "1x15",
          formCue: "Forearm on your knee, curl the bottle up using only your wrist, slow on the way down.",
        },
        {
          name: "Wrist extensions with water bottle",
          prescription: "1x15",
          formCue: "Same setup, raise the back of your hand toward the ceiling with a controlled tempo.",
        },
        {
          name: "Forearm rotations with water bottle",
          prescription: "1x15 each direction",
          formCue: "Hold the bottle vertical and rotate your forearm palm up and palm down without moving your elbow.",
        },
        {
          name: "Prone Y-T-W",
          prescription: "2x8 each letter",
          formCue: "Lie face down, lift your arms into Y, then T, then W shapes with thumbs up and no lower back arch.",
        },
        {
          name: "90/90 band external rotation",
          prescription: "2x10 each arm",
          formCue: "Elbow and shoulder at 90 degrees; rotate the band up without letting your elbow drift forward.",
        },
        {
          name: "Scap push-ups",
          prescription: "2x12",
          formCue: "In a push-up position, keep arms straight and only move your shoulder blades in and out.",
        },
        {
          name: "Light long toss progression with a partner",
          prescription: "Build distance slowly",
          formCue: "Easy throws only; add distance gradually and stop well before max effort.",
          optional: true,
        },
      ],
      weeks9to12: [
        {
          name: "Band pull-aparts",
          prescription: "2-3x15",
          formCue: "Stand tall, pull the band to your chest with straight wrists and squeeze your shoulder blades.",
        },
        {
          name: "Band external rotation at side (elbow 90, towel under arm)",
          prescription: "2-3x12 each arm",
          formCue: "Keep your elbow pinned at your side and rotate your forearm out without shrugging.",
        },
        {
          name: "Band internal rotation at side",
          prescription: "2-3x12 each arm",
          formCue: "Same setup as external rotation; rotate your forearm in with control, no trunk twist.",
        },
        {
          name: "Band rows",
          prescription: "2-3x15",
          formCue: "Pull your elbows back like starting a lawn mower; pause when your hands reach your ribs.",
        },
        {
          name: "Wall slides",
          prescription: "2-3x10",
          formCue: "Forearms on the wall, slide up and down while keeping your lower back flat to the wall.",
        },
        {
          name: "Open-book thoracic rotation",
          prescription: "1x8 each side",
          formCue: "On your side, open your top arm like a book and follow your hand with your eyes.",
        },
        {
          name: "Wrist curls with water bottle",
          prescription: "1x15",
          formCue: "Forearm on your knee, curl the bottle up using only your wrist, slow on the way down.",
        },
        {
          name: "Wrist extensions with water bottle",
          prescription: "1x15",
          formCue: "Same setup, raise the back of your hand toward the ceiling with a controlled tempo.",
        },
        {
          name: "Forearm rotations with water bottle",
          prescription: "1x15 each direction",
          formCue: "Hold the bottle vertical and rotate your forearm palm up and palm down without moving your elbow.",
        },
        {
          name: "Prone Y-T-W",
          prescription: "2-3x8 each letter",
          formCue: "Lie face down, lift your arms into Y, then T, then W shapes with thumbs up and no lower back arch.",
        },
        {
          name: "90/90 band external rotation",
          prescription: "2-3x10 each arm",
          formCue: "Elbow and shoulder at 90 degrees; rotate the band up without letting your elbow drift forward.",
        },
        {
          name: "Scap push-ups",
          prescription: "2-3x12",
          formCue: "In a push-up position, keep arms straight and only move your shoulder blades in and out.",
        },
        {
          name: "Band decelerations",
          prescription: "2x8 each arm",
          formCue: "Slowly resist the band as it pulls your arm forward; control the eccentric like slowing a throw.",
        },
        {
          name: "Med ball overhead wall throws",
          prescription: "2x6",
          formCue: "Stand facing a wall, throw overhead with both hands and catch softly on the rebound.",
          optional: true,
        },
        {
          name: "Med ball rotational wall throws",
          prescription: "2x6 each side",
          formCue: "Rotate from your hips, throw into the wall at chest height, and reset between reps.",
          optional: true,
        },
        {
          name: "Long toss plus quick-release throws",
          prescription: "Farther long toss, then 10 quick throws to a target",
          formCue: "Build distance first, then finish with short, quick transfers to a target with a partner.",
          optional: true,
        },
      ],
    },
  },
  {
    key: "catcher",
    label: "Catcher Skills",
    description:
      "Short daily catcher work: receiving, blocking, transfers, and footwork using tennis balls and a wall.",
    daysOfWeek: [2, 4, 6],
    minutesLabel: "10-15 min",
    equipment: "Tennis balls, glove, wall",
    safetyNote:
      "Use tennis balls only unless a coach sets up live blocking. Stay in athletic posture and stop if your knees or back feel sharp pain.",
    recommendedDrillVimeoIds: ["1233143850", "1205924080"],
    phases: {
      weeks1to4: [
        {
          name: "Bare-hand tennis ball wall catches",
          prescription: "50 reps",
          formCue: "Soft hands, catch out front, and quiet your glove hand before you reset.",
        },
        {
          name: "Receiving from a knee (soft hands, stick and hold)",
          prescription: "30 reps",
          formCue: "Give with the ball, freeze the glove for one second, and keep your chest over the ball.",
        },
        {
          name: "Glove-to-hand quick transfers",
          prescription: "3x15",
          formCue: "Catch, transfer to your throwing hand at your chest, and show the ball to the wall target.",
        },
      ],
      weeks5to8: [
        {
          name: "Blocking (tennis balls off the wall, drop and smother)",
          prescription: "3x10",
          formCue: "Drop your knees, get your chest over the ball, and smother it in front of your body.",
        },
        {
          name: "Two-ball transfers",
          prescription: "3x10",
          formCue: "Hold two tennis balls, transfer one at a time to your throwing hand without dropping either.",
        },
        {
          name: "Dry throw-down footwork to 2B (time the footwork)",
          prescription: "10 reps",
          formCue: "Hit your footwork landmarks first, then finish your throw motion toward second base.",
        },
        {
          name: "Reaction ball or tennis ball off an uneven surface",
          prescription: "2 minutes",
          formCue: "Stay low, react to the bounce, and catch out front with quiet hands.",
        },
      ],
      weeks9to12: [
        {
          name: "Footwork plus a real throw to a target",
          prescription: "10 throws",
          formCue: "Full footwork to second, transfer, and make a firm throw to a target at chest height.",
        },
        {
          name: "Block and recover",
          prescription: "3x8",
          formCue: "Block the ball, pop up quickly, and get your feet set for the next rep.",
        },
        {
          name: "Two-ball juggle",
          prescription: "3x30 sec",
          formCue: "Keep your eyes up, soft hands, and stay in your stance while you juggle two tennis balls.",
        },
        {
          name: "Framing on the edges of the zone",
          prescription: "20 reps",
          formCue: "Receive borderline pitches with a quiet glove and hold the strike for the umpire.",
        },
      ],
    },
  },
];

export function listProgramTrackDefinitions() {
  return PROGRAM_TRACKS;
}
