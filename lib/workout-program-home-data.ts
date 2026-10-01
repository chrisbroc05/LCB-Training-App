import type { WorkoutExercise, WorkoutId, WorkoutPhase, WorkoutSection } from "@/lib/workout-program-types";
import type { StrengthVariant } from "@/lib/strength-variant-shared";

export type HomeStrengthTemplate = {
  variant: StrengthVariant;
  ageGroup: "12-15" | "16-18";
  phase: WorkoutPhase;
  workoutId: WorkoutId;
  title: string;
  sections: WorkoutSection[];
};

export const HOME_STRENGTH_SAFETY_NOTE = "Clear some space and wear shoes. Stair work only on dry stairs with a rail, and only from the bottom step. Land soft on every jump. Stop any exercise that hurts (a burn is fine, pain is not). Ages 12-15: have an adult home for weights and stair work.";

export const HOME_STRENGTH_GLOSSARY: Record<string, string> = {
  "Jog in place": "Stay light on the balls of your feet, arms swinging.",
  "Leg swings": "Hold a wall, stay tall, swing from the hip without forcing it.",
  "Walking lunge with overhead reach": "Long step, back knee near the floor, reach both arms up and stay tall.",
  "Arm circles": "Arms straight, start small and finish big.",
  "Inchworm": "Hinge down, walk hands out to a plank, walk feet up to hands. Keep legs as straight as you can.",
  "Pogo hops": "Stiff ankles, quick little bounces on the balls of your feet, spend as little time on the ground as possible.",
  "Skater jumps": "Jump sideways off one leg, land on the other, stick it for a second. Chest up, knee over toes.",
  "Single-leg hops": "Hop forward on one leg and stick the landing for 2 seconds before the next hop.",
  "Lateral single-leg hops": "Hop side to side on one leg, stick each landing.",
  "Line hops": "Two feet together, hop side to side over a line as fast as you can.",
  "Hurdle hops": "Set a shoe, backpack, or rolled towel on the floor. Jump over it with two feet and land soft.",
  "Lateral hurdle hops": "Same as hurdle hops but jumping sideways over the object.",
  "Quick feet": "Fast tiny steps in place, arms pumping, stay low.",
  "Lateral shuffle": "Stay low in an athletic stance, push off the trail foot, do not cross your feet.",
  "Stair drop to vertical jump": "Step off the bottom stair, land on both feet soft and quiet, then jump straight up as high as you can.",
  "Stair drop to broad jump": "Step off the bottom stair, land soft, then jump forward as far as you can and stick the landing.",
  "Broad jump": "Swing your arms, jump forward as far as you can, land with both feet and hold for 2 seconds.",
  "Broad jump to sprint": "Broad jump, stick it, then sprint 5 steps.",
  "Burpee broad jump": "Burpee, then a broad jump forward, stick it, repeat.",
  "Stair runs": "Run up the stairs one step at a time, walk down holding the rail.",
  "Stair skips": "Run up taking every other step, walk down holding the rail.",
  "Stair sprints": "Fastest feet possible going up, every step. Walk down holding the rail.",
  "Bodyweight squat": "Feet shoulder width, sit back and down, chest up, knees track over toes.",
  "Jump squat": "Squat to parallel then explode up, land soft and go right into the next rep.",
  "Reverse lunge": "Step back, drop the back knee toward the floor, push through the front heel to stand.",
  "Walking lunges": "Long steps, back knee near the floor, stay tall.",
  "Bulgarian split squat": "Back foot on the second stair or a couch, drop straight down, front knee over the toes.",
  "Single-leg squat to stair": "Stand on one leg in front of the bottom stair, sit back until you touch it, stand back up without using the other leg.",
  "Glute bridge": "Lie on your back, feet flat, squeeze your glutes to lift your hips, pause at the top.",
  "Single-leg glute bridge": "Same as a glute bridge with one foot in the air.",
  "Stair step-up": "Whole foot on the step, drive through that heel to stand tall, step down with control.",
  "Stair step-up with knee drive": "Step up and drive the other knee up to your hip, like a sprinter.",
  "Nordic hamstring lowers": "Kneel with your heels hooked under a couch, keep your body straight from knees to head, and lower forward as slowly as you can. Catch yourself with your hands, push back up.",
  "Plank": "Forearms down, straight line from head to heels, squeeze glutes and abs.",
  "Plank shoulder taps": "High plank, tap the opposite shoulder without letting your hips rock.",
  "Side plank": "On your forearm, hips up, straight line from head to feet.",
  "Side plank with hip dips": "Side plank, lower your hip toward the floor and lift it back up.",
  "Push-up": "Hands under shoulders, body in a straight line, chest to just above the floor. Drop to your knees if needed.",
  "Decline push-up": "Feet on the bottom stair, hands on the floor, same push-up form.",
  "Plyo push-up": "Push up hard enough that your hands leave the floor, land soft and go right into the next rep.",
  "Pilates push-up": "Roll down to the floor, walk your hands out to a plank, do 1 push-up, walk back and roll up to stand.",
  "Pull-up": "Hang from the bar, pull until your chin is over it, lower all the way slowly.",
  "Pull-up negatives": "Jump or step up so your chin is over the bar, then lower as slowly as you can (aim for 3-5 seconds).",
  "Backpack row": "Fill a backpack with books, hinge forward with a flat back, pull it to your belly button, squeeze your shoulder blades.",
  "Rotational lunge": "Step into a lunge and rotate your chest toward the front leg, arms out. Come back to stand.",
  "Backpack woodchop": "Hold a loaded backpack, rotate from high by one shoulder down across your body to the opposite hip, turning your back foot like a swing.",
  "Y-T-W raises": "Lie face down, thumbs up, lift your arms into a Y, then a T, then a W. Squeeze your shoulder blades, slow and controlled.",
  "Bear crawl": "Hands and feet on the floor, knees just off the ground, crawl forward with your back flat.",
  "Crab walk": "Sit, hands behind you, lift your hips and walk forward on hands and feet.",
  "Dead bug": "Lie on your back, arms up, knees at 90 degrees. Lower the opposite arm and leg slowly while keeping your low back flat.",
  "Single-leg stretch": "Lie on your back, head and shoulders up, pull one knee in while the other leg straightens. Switch.",
  "Criss-cross": "Same position, rotate to bring the opposite elbow toward the bent knee. Slow and controlled.",
  "The hundred": "Lie on your back, head and shoulders up, legs up (bent or straight), pump your arms up and down while breathing in for 5 and out for 5. Count to 100.",
  "Swimming": "Lie face down, lift your arms and legs slightly, flutter the opposite arm and leg quickly.",
  "Teaser prep": "Lie on your back with knees bent, roll up toward your knees with arms reaching forward, roll back down slowly.",
  "Teaser": "Legs up at an angle, roll up to a V with arms reaching for your toes, roll down slowly.",
  "Goblet squat": "Hold one dumbbell or the kettlebell at your chest, squat deep, chest tall, elbows inside your knees.",
  "Dumbbell RDL": "Hinge at the hips with a slight knee bend, lower the weight along your legs, squeeze your glutes to stand.",
  "Single-leg RDL": "Hinge on one leg, the other leg goes back, keep hips square, stand back up.",
  "Weighted reverse lunge": "Hold the weight at your chest or at your sides, step back into a lunge.",
  "Weighted step-up": "Hold the weight at your sides, step up onto the bottom stair, drive through the heel.",
  "Kettlebell swing": "Hinge, hike the weight back between your legs, snap your hips forward so it floats to chest height. Arms are just ropes. A dumbbell held by one end works too.",
  "Single-arm row": "One hand on a couch or chair, flat back, pull the weight to your hip, lower slowly.",
  "Floor press": "Lie on your back, knees bent, press the weight up from your chest, lower until your elbows touch the floor.",
  "Half-kneeling single-arm press": "Kneel on one knee, press the weight straight overhead with the same-side arm as the down knee, ribs down.",
  "Push press": "Weight at your shoulder, small dip with your knees, then drive up and press it overhead.",
  "Halo": "Hold the weight by the handles at your chest, circle it slowly around your head, both directions.",
  "Suitcase carry": "Hold the weight at one side, walk tall without leaning.",
  "Dumbbell jump squat": "Hold a light dumbbell at your chest, quarter squat and jump. Light weight only.",
  "Renegade row": "High plank holding the dumbbells (or one hand on the floor), row one weight to your hip without twisting.",
};

function wu(): WorkoutSection {
  return {
    name: "Warm-Up",
    exercises: [
      sa("Jog in place", "1", "60 sec", "-"),
      sa("Leg swings, front to back and side to side", "1", "10 each direction", "-"),
      sa("Walking lunge with overhead reach", "1", "6 each leg", "-"),
      sa("Arm circles, small to big", "1", "10 each direction", "-"),
      sa("Inchworm", "1", "5 reps", "-"),
      sa("Pogo hops", "1", "15 reps", "-"),
    ],
  };
}

function cd(): WorkoutSection {
  return {
    name: "Cooldown",
    exercises: [
      { name: "Half-kneeling hip flexor stretch (each side)", repsOrTime: "30 sec", rest: "-" },
      { name: "Seated hamstring stretch (each side)", repsOrTime: "30 sec", rest: "-" },
      { name: "Figure-4 glute stretch (each side)", repsOrTime: "30 sec", rest: "-" },
      { name: "Cross-body shoulder stretch (each side)", repsOrTime: "30 sec", rest: "-" },
      { name: "Doorway chest stretch", repsOrTime: "30 sec", rest: "-" },
      { name: "Child's pose", repsOrTime: "30 sec", rest: "-" },
    ],
  };
}

function sa(name: string, sets: string, repsOrTime: string, rest: string): WorkoutExercise {
  const exercise: WorkoutExercise = { name, sets, repsOrTime, rest };
  return exercise;
}

function cex(name: string, repsOrTime: string, alternativeRepsOrTime?: string): WorkoutExercise {
  const altMatch = name.match(/^(.+?) \/ alt: (.+)$/);
  if (altMatch) {
    const exercise: WorkoutExercise = {
      name: altMatch[1],
      repsOrTime,
      rest: "-",
      alternativeName: altMatch[2],
    };
    if (alternativeRepsOrTime) {
      exercise.alternativeRepsOrTime = alternativeRepsOrTime;
    }
    return exercise;
  }
  return { name, repsOrTime, rest: "-" };
}

function ss(name: string, sets: string, repsOrTime: string, rest: string, alternativeRepsOrTime?: string): WorkoutExercise {
  const altMatch = name.match(/^(.+?) \/ alt: (.+)$/);
  if (altMatch) {
    const exercise: WorkoutExercise = {
      name: altMatch[1],
      sets,
      repsOrTime,
      rest,
      alternativeName: altMatch[2],
    };
    if (alternativeRepsOrTime) {
      exercise.alternativeRepsOrTime = alternativeRepsOrTime;
    }
    return exercise;
  }
  return { name, sets, repsOrTime, rest };
}

function fin(name: string, sets: string, repsOrTime: string, rest: string): WorkoutExercise {
  return { name, sets, repsOrTime, rest };
}

export const HOME_STRENGTH_TEMPLATES: HomeStrengthTemplate[] = [
  {
    variant: "bodyweight",
    ageGroup: "12-15",
    phase: "foundation",
    workoutId: "A",
    title: "Lower Body and Power",
    sections: [
      wu(),
      {
        name: "Speed and Agility",
        exercises: [
          sa("Pogo hops", "2", "15", "30 sec"),
          sa("Skater jumps", "2", "5 each side", "30 sec"),
          sa("Line hops", "2", "10 sec", "30 sec"),
        ],
      },
      {
        name: "Circuit",
        rounds: 3,
        rest: "60 sec rest between rounds",
        exercises: [
          cex("Bodyweight squat", "15"),
          cex("Reverse lunge", "8 each leg"),
          cex("Glute bridge", "15"),
          cex("Stair step-up", "10 each leg"),
          cex("Plank", "30 sec"),
        ],
      },
      {
        name: "Power",
        exercises: [
          sa("Stair drop to vertical jump", "3", "4", "60 sec"),
          sa("Broad jump", "3", "4", "60 sec"),
        ],
      },
      {
        name: "Finisher",
        exercises: [
          fin("Stair runs", "1", "5 trips up", "walk down"),
        ],
      },
      {
        name: "Pilates Core",
        exercises: [
          fin("Dead bug", "2", "8 each side", "-"),
          fin("Single-leg stretch", "2", "10", "-"),
        ],
      },
      cd(),
    ],
  },
  {
    variant: "bodyweight",
    ageGroup: "12-15",
    phase: "foundation",
    workoutId: "B",
    title: "Upper Body and Rotation",
    sections: [
      wu(),
      {
        name: "Speed and Agility",
        exercises: [
          sa("Quick feet", "3", "10 sec", "30 sec"),
          sa("Hurdle hops (forward and back)", "2", "8", "30 sec"),
        ],
      },
      {
        name: "Circuit",
        rounds: 3,
        rest: "60 sec rest",
        exercises: [
          cex("Push-up", "8-10"),
          cex("Pull-up negatives / alt: Backpack row", "3", "12"),
          cex("Rotational lunge", "6 each side"),
          cex("Side plank", "20 sec each side"),
          cex("Y-T-W raises", "6 each letter"),
        ],
      },
      {
        name: "Pilates Core",
        exercises: [
          fin("Pilates push-up", "2", "5", "-"),
          fin("Swimming", "2", "20 sec", "-"),
          fin("The hundred (knees bent)", "1", "50 count", "-"),
        ],
      },
      {
        name: "Finisher",
        exercises: [
          fin("Bear crawl", "2", "20 feet", "-"),
        ],
      },
      cd(),
    ],
  },
  {
    variant: "bodyweight",
    ageGroup: "12-15",
    phase: "build",
    workoutId: "A",
    title: "Lower Body and Power",
    sections: [
      wu(),
      {
        name: "Speed and Agility",
        exercises: [
          sa("Pogo hops", "3", "20", "30 sec"),
          sa("Single-leg hops", "2", "5 each leg", "45 sec"),
          sa("Skater jumps", "3", "6 each side", "30 sec"),
        ],
      },
      {
        name: "Circuit",
        rounds: 3,
        rest: "45 sec rest",
        exercises: [
          cex("Jump squat", "10"),
          cex("Walking lunges", "10 each leg"),
          cex("Single-leg glute bridge", "10 each leg"),
          cex("Stair step-up with knee drive", "10 each leg"),
          cex("Plank shoulder taps", "20"),
        ],
      },
      {
        name: "Power",
        exercises: [
          sa("Stair drop to broad jump", "3", "4", "60 sec"),
          sa("Lateral hurdle hops", "3", "6", "45 sec"),
        ],
      },
      {
        name: "Finisher",
        exercises: [
          fin("Stair skips", "2", "5 trips up", "walk down, 60 sec between sets"),
        ],
      },
      {
        name: "Pilates Core",
        exercises: [
          fin("Single-leg stretch", "2", "12", "-"),
          fin("Criss-cross", "2", "10 each side", "-"),
        ],
      },
      cd(),
    ],
  },
  {
    variant: "bodyweight",
    ageGroup: "12-15",
    phase: "build",
    workoutId: "B",
    title: "Upper Body and Rotation",
    sections: [
      wu(),
      {
        name: "Speed and Agility",
        exercises: [
          sa("Lateral shuffle", "3", "5 steps each way, 2 times", "30 sec"),
          sa("Hurdle hops (forward and back)", "3", "8", "30 sec"),
        ],
      },
      {
        name: "Circuit",
        rounds: 3,
        rest: "45 sec rest",
        exercises: [
          cex("Decline push-up", "10-12"),
          cex("Pull-up / alt: Backpack row", "3-6", "15"),
          cex("Backpack woodchop", "8 each side"),
          cex("Side plank with hip dips", "10 each side"),
          cex("Y-T-W raises", "8 each letter"),
        ],
      },
      {
        name: "Pilates Core",
        exercises: [
          fin("Pilates push-up", "3", "6", "-"),
          fin("Swimming", "3", "20 sec", "-"),
          fin("Teaser prep", "2", "6", "-"),
        ],
      },
      {
        name: "Finisher",
        exercises: [
          fin("Bear crawl", "2", "20 feet", "-"),
          fin("Crab walk", "2", "20 feet", "-"),
        ],
      },
      cd(),
    ],
  },
  {
    variant: "bodyweight",
    ageGroup: "12-15",
    phase: "compete",
    workoutId: "A",
    title: "Lower Body and Power",
    sections: [
      wu(),
      {
        name: "Speed and Agility",
        exercises: [
          sa("Pogo hops (as fast as possible)", "3", "20", "30 sec"),
          sa("Lateral single-leg hops", "3", "5 each leg", "45 sec"),
          sa("Hurdle hops (continuous, no pause)", "3", "5", "45 sec"),
        ],
      },
      {
        name: "Circuit",
        rounds: 4,
        rest: "45 sec rest",
        exercises: [
          cex("Jump squat", "12"),
          cex("Bulgarian split squat", "8 each leg"),
          cex("Single-leg glute bridge", "12 each leg"),
          cex("Skater jumps", "8 each side"),
          cex("Plank", "45 sec"),
        ],
      },
      {
        name: "Power",
        exercises: [
          sa("Stair drop to vertical jump (max height)", "3", "5", "60 sec"),
          sa("Broad jump to sprint", "4", "1", "45 sec"),
        ],
      },
      {
        name: "Finisher",
        exercises: [
          fin("Stair sprints", "2", "6 trips up", "walk down, 90 sec between sets"),
        ],
      },
      {
        name: "Pilates Core",
        exercises: [
          fin("The hundred", "1", "100 count", "-"),
          fin("Criss-cross", "2", "12 each side", "-"),
        ],
      },
      cd(),
    ],
  },
  {
    variant: "bodyweight",
    ageGroup: "12-15",
    phase: "compete",
    workoutId: "B",
    title: "Upper Body and Rotation",
    sections: [
      wu(),
      {
        name: "Speed and Agility",
        exercises: [
          sa("Quick feet", "3", "15 sec", "30 sec"),
          sa("Lateral hurdle hops", "3", "8", "30 sec"),
        ],
      },
      {
        name: "Circuit",
        rounds: 4,
        rest: "45 sec rest",
        exercises: [
          cex("Plyo push-up (knees allowed)", "6-8"),
          cex("Pull-up / alt: Backpack row", "max minus 1", "15"),
          cex("Rotational lunge", "8 each side"),
          cex("Side plank", "40 sec each side"),
          cex("Y-T-W raises", "10 each letter"),
        ],
      },
      {
        name: "Pilates Core",
        exercises: [
          fin("Pilates push-up", "3", "8", "-"),
          fin("Swimming", "3", "30 sec", "-"),
          fin("Teaser", "2", "6", "-"),
        ],
      },
      {
        name: "Finisher",
        exercises: [
          fin("Burpee broad jump", "3", "5", "60 sec"),
        ],
      },
      cd(),
    ],
  },
  {
    variant: "bodyweight",
    ageGroup: "16-18",
    phase: "foundation",
    workoutId: "A",
    title: "Lower Body and Power",
    sections: [
      wu(),
      {
        name: "Speed and Agility",
        exercises: [
          sa("Pogo hops", "3", "20", "30 sec"),
          sa("Skater jumps", "3", "6 each side", "30 sec"),
          sa("Single-leg hops", "2", "5 each leg", "45 sec"),
        ],
      },
      {
        name: "Circuit",
        rounds: 3,
        rest: "60 sec rest",
        exercises: [
          cex("Jump squat", "10"),
          cex("Bulgarian split squat", "8 each leg"),
          cex("Single-leg glute bridge", "10 each leg"),
          cex("Stair step-up with knee drive", "10 each leg"),
          cex("Plank", "45 sec"),
        ],
      },
      {
        name: "Power",
        exercises: [
          sa("Stair drop to vertical jump", "3", "5", "60 sec"),
          sa("Broad jump", "3", "5", "60 sec"),
        ],
      },
      {
        name: "Finisher",
        exercises: [
          fin("Stair runs", "2", "5 trips up", "walk down, 60 sec between sets"),
        ],
      },
      {
        name: "Pilates Core",
        exercises: [
          fin("Dead bug", "2", "10 each side", "-"),
          fin("Criss-cross", "2", "10 each side", "-"),
        ],
      },
      cd(),
    ],
  },
  {
    variant: "bodyweight",
    ageGroup: "16-18",
    phase: "foundation",
    workoutId: "B",
    title: "Upper Body and Rotation",
    sections: [
      wu(),
      {
        name: "Speed and Agility",
        exercises: [
          sa("Lateral shuffle", "3", "5 steps each way, 2 times", "30 sec"),
          sa("Hurdle hops (forward and back)", "3", "8", "30 sec"),
        ],
      },
      {
        name: "Circuit",
        rounds: 3,
        rest: "60 sec rest",
        exercises: [
          cex("Push-up", "15"),
          cex("Pull-up / alt: Backpack row", "5-8", "15"),
          cex("Backpack woodchop", "8 each side"),
          cex("Side plank with hip dips", "10 each side"),
          cex("Y-T-W raises", "8 each letter"),
        ],
      },
      {
        name: "Pilates Core",
        exercises: [
          fin("Pilates push-up", "3", "6", "-"),
          fin("Swimming", "3", "30 sec", "-"),
          fin("Teaser prep", "2", "8", "-"),
        ],
      },
      {
        name: "Finisher",
        exercises: [
          fin("Bear crawl", "3", "20 feet", "-"),
        ],
      },
      cd(),
    ],
  },
  {
    variant: "bodyweight",
    ageGroup: "16-18",
    phase: "build",
    workoutId: "A",
    title: "Lower Body and Power",
    sections: [
      wu(),
      {
        name: "Speed and Agility",
        exercises: [
          sa("Pogo hops", "3", "25", "30 sec"),
          sa("Lateral single-leg hops", "3", "5 each leg", "45 sec"),
          sa("Lateral hurdle hops", "3", "8", "30 sec"),
        ],
      },
      {
        name: "Circuit",
        rounds: 4,
        rest: "45 sec rest",
        exercises: [
          cex("Single-leg squat to stair", "6 each leg"),
          cex("Walking lunges", "12 each leg"),
          cex("Single-leg glute bridge", "12 each leg"),
          cex("Skater jumps", "8 each side"),
          cex("Plank shoulder taps", "24"),
        ],
      },
      {
        name: "Power",
        exercises: [
          sa("Stair drop to broad jump", "4", "4", "60 sec"),
          sa("Nordic hamstring lowers", "3", "4", "90 sec"),
        ],
      },
      {
        name: "Finisher",
        exercises: [
          fin("Stair skips", "3", "5 trips up", "walk down, 60 sec between sets"),
        ],
      },
      {
        name: "Pilates Core",
        exercises: [
          fin("The hundred", "1", "100 count", "-"),
          fin("Single-leg stretch", "2", "15", "-"),
        ],
      },
      cd(),
    ],
  },
  {
    variant: "bodyweight",
    ageGroup: "16-18",
    phase: "build",
    workoutId: "B",
    title: "Upper Body and Rotation",
    sections: [
      wu(),
      {
        name: "Speed and Agility",
        exercises: [
          sa("Quick feet", "3", "15 sec", "30 sec"),
          sa("Hurdle hops (continuous)", "3", "6", "45 sec"),
        ],
      },
      {
        name: "Circuit",
        rounds: 4,
        rest: "45 sec rest",
        exercises: [
          cex("Decline push-up", "15"),
          cex("Pull-up / alt: Backpack row", "6-10", "20"),
          cex("Rotational lunge", "8 each side"),
          cex("Side plank", "45 sec each side"),
          cex("Y-T-W raises", "10 each letter"),
        ],
      },
      {
        name: "Pilates Core",
        exercises: [
          fin("Plyo push-up", "3", "6", "-"),
          fin("Swimming", "3", "30 sec", "-"),
          fin("Teaser", "2", "6", "-"),
        ],
      },
      {
        name: "Finisher",
        exercises: [
          fin("Bear crawl", "2", "30 feet", "-"),
          fin("Crab walk", "2", "30 feet", "-"),
        ],
      },
      cd(),
    ],
  },
  {
    variant: "bodyweight",
    ageGroup: "16-18",
    phase: "compete",
    workoutId: "A",
    title: "Lower Body and Power",
    sections: [
      wu(),
      {
        name: "Speed and Agility",
        exercises: [
          sa("Pogo hops (as fast as possible)", "3", "25", "30 sec"),
          sa("Single-leg hops", "3", "6 each leg", "45 sec"),
          sa("Hurdle hops (continuous)", "3", "8", "45 sec"),
        ],
      },
      {
        name: "Circuit",
        rounds: 4,
        rest: "45 sec rest",
        exercises: [
          cex("Jump squat", "15"),
          cex("Bulgarian split squat", "10 each leg"),
          cex("Single-leg glute bridge", "15 each leg"),
          cex("Skater jumps (stick 1 second)", "10 each side"),
          cex("Plank", "60 sec"),
        ],
      },
      {
        name: "Power",
        exercises: [
          sa("Stair drop to vertical jump (max height)", "4", "5", "60 sec"),
          sa("Broad jump to sprint", "5", "1", "45 sec"),
          sa("Nordic hamstring lowers", "3", "5", "90 sec"),
        ],
      },
      {
        name: "Finisher",
        exercises: [
          fin("Stair sprints", "3", "6 trips up", "walk down, 90 sec between sets"),
        ],
      },
      {
        name: "Pilates Core",
        exercises: [
          fin("The hundred", "1", "100 count", "-"),
          fin("Criss-cross", "3", "12 each side", "-"),
        ],
      },
      cd(),
    ],
  },
  {
    variant: "bodyweight",
    ageGroup: "16-18",
    phase: "compete",
    workoutId: "B",
    title: "Upper Body and Rotation",
    sections: [
      wu(),
      {
        name: "Speed and Agility",
        exercises: [
          sa("Lateral shuffle", "4", "5 steps each way, 2 times", "30 sec"),
          sa("Lateral hurdle hops", "3", "10", "30 sec"),
        ],
      },
      {
        name: "Circuit",
        rounds: 4,
        rest: "45 sec rest",
        exercises: [
          cex("Plyo push-up", "8-10"),
          cex("Pull-up / alt: Backpack row", "max minus 1", "20"),
          cex("Backpack woodchop", "10 each side"),
          cex("Side plank with hip dips", "15 each side"),
          cex("Y-T-W raises", "10 each letter"),
        ],
      },
      {
        name: "Pilates Core",
        exercises: [
          fin("Pilates push-up", "3", "10", "-"),
          fin("Swimming", "3", "40 sec", "-"),
          fin("Teaser", "3", "6", "-"),
        ],
      },
      {
        name: "Finisher",
        exercises: [
          fin("Burpee broad jump", "4", "5", "60 sec"),
        ],
      },
      cd(),
    ],
  },
  {
    variant: "home_weights",
    ageGroup: "12-15",
    phase: "foundation",
    workoutId: "A",
    title: "Lower Body and Power",
    sections: [
      wu(),
      {
        name: "Speed and Agility",
        exercises: [
          sa("Pogo hops", "2", "15", "30 sec"),
          sa("Skater jumps", "2", "5 each side", "30 sec"),
        ],
      },
      {
        name: "Strength (straight sets)",
        exercises: [
          ss("Goblet squat", "3", "10", "75 sec"),
          ss("Dumbbell RDL", "3", "10", "75 sec"),
          ss("Weighted reverse lunge", "2", "8 each leg", "60 sec"),
          ss("Glute bridge", "2", "15", "45 sec"),
        ],
      },
      {
        name: "Power",
        exercises: [
          sa("Broad jump", "3", "4", "60 sec"),
        ],
      },
      {
        name: "Pilates Core",
        exercises: [
          fin("Dead bug", "2", "8 each side", "-"),
          fin("Single-leg stretch", "2", "10", "-"),
        ],
      },
      cd(),
    ],
  },
  {
    variant: "home_weights",
    ageGroup: "12-15",
    phase: "foundation",
    workoutId: "B",
    title: "Upper Body and Rotation",
    sections: [
      wu(),
      {
        name: "Speed and Agility",
        exercises: [
          sa("Hurdle hops (forward and back)", "2", "8", "30 sec"),
        ],
      },
      {
        name: "Strength (straight sets)",
        exercises: [
          ss("Single-arm row", "3", "10 each arm", "60 sec"),
          ss("Floor press", "3", "10", "60 sec"),
          ss("Half-kneeling single-arm press", "2", "8 each arm", "60 sec"),
          ss("Halo", "2", "5 each direction", "45 sec"),
          ss("Suitcase carry", "2", "30 feet each side", "45 sec"),
        ],
      },
      {
        name: "Pilates Core",
        exercises: [
          fin("Pilates push-up", "2", "5", "-"),
          fin("Swimming", "2", "20 sec", "-"),
        ],
      },
      cd(),
    ],
  },
  {
    variant: "home_weights",
    ageGroup: "12-15",
    phase: "build",
    workoutId: "A",
    title: "Lower Body and Power",
    sections: [
      wu(),
      {
        name: "Speed and Agility",
        exercises: [
          sa("Pogo hops", "3", "20", "30 sec"),
          sa("Single-leg hops", "2", "5 each leg", "45 sec"),
        ],
      },
      {
        name: "Circuit",
        rounds: 3,
        rest: "60 sec rest",
        exercises: [
          cex("Goblet squat", "12"),
          cex("Kettlebell swing", "12"),
          cex("Weighted step-up", "8 each leg"),
          cex("Single-leg RDL (holding the weight)", "8 each leg"),
          cex("Plank", "40 sec"),
        ],
      },
      {
        name: "Power",
        exercises: [
          sa("Stair drop to vertical jump", "3", "4", "60 sec"),
        ],
      },
      {
        name: "Pilates Core",
        exercises: [
          fin("Criss-cross", "2", "10 each side", "-"),
          fin("The hundred (knees bent)", "1", "100 count", "-"),
        ],
      },
      cd(),
    ],
  },
  {
    variant: "home_weights",
    ageGroup: "12-15",
    phase: "build",
    workoutId: "B",
    title: "Upper Body and Rotation",
    sections: [
      wu(),
      {
        name: "Speed and Agility",
        exercises: [
          sa("Lateral shuffle", "3", "5 steps each way, 2 times", "30 sec"),
        ],
      },
      {
        name: "Circuit",
        rounds: 3,
        rest: "60 sec rest",
        exercises: [
          cex("Single-arm row", "12 each arm"),
          cex("Push-up", "12"),
          cex("Push press", "8 each arm (or both together)"),
          cex("Halo", "6 each direction"),
          cex("Side plank", "30 sec each side"),
          cex("Y-T-W raises", "8 each letter"),
        ],
      },
      {
        name: "Pilates Core",
        exercises: [
          fin("Pilates push-up", "3", "6", "-"),
          fin("Teaser prep", "2", "6", "-"),
        ],
      },
      cd(),
    ],
  },
  {
    variant: "home_weights",
    ageGroup: "12-15",
    phase: "compete",
    workoutId: "A",
    title: "Lower Body and Power",
    sections: [
      wu(),
      {
        name: "Speed and Agility",
        exercises: [
          sa("Pogo hops (as fast as possible)", "3", "20", "30 sec"),
          sa("Hurdle hops (continuous)", "3", "5", "45 sec"),
        ],
      },
      {
        name: "Circuit",
        rounds: 4,
        rest: "60 sec rest",
        exercises: [
          cex("Kettlebell swing (explosive)", "15"),
          cex("Goblet squat", "12"),
          cex("Dumbbell jump squat (light)", "6"),
          cex("Weighted reverse lunge", "8 each leg"),
          cex("Plank", "45 sec"),
        ],
      },
      {
        name: "Power",
        exercises: [
          sa("Broad jump to sprint", "4", "1", "45 sec"),
        ],
      },
      {
        name: "Finisher",
        exercises: [
          fin("Stair sprints", "2", "5 trips up", "walk down, 90 sec between sets"),
        ],
      },
      {
        name: "Pilates Core",
        exercises: [
          fin("Criss-cross", "2", "12 each side", "-"),
        ],
      },
      cd(),
    ],
  },
  {
    variant: "home_weights",
    ageGroup: "12-15",
    phase: "compete",
    workoutId: "B",
    title: "Upper Body and Rotation",
    sections: [
      wu(),
      {
        name: "Speed and Agility",
        exercises: [
          sa("Quick feet", "3", "15 sec", "30 sec"),
        ],
      },
      {
        name: "Circuit",
        rounds: 4,
        rest: "60 sec rest",
        exercises: [
          cex("Renegade row", "6 each arm"),
          cex("Floor press", "12"),
          cex("Push press", "8 each arm"),
          cex("Backpack woodchop (use the dumbbell)", "8 each side"),
          cex("Suitcase carry", "40 feet each side"),
        ],
      },
      {
        name: "Pilates Core",
        exercises: [
          fin("Swimming", "3", "30 sec", "-"),
          fin("Teaser", "2", "6", "-"),
        ],
      },
      {
        name: "Finisher",
        exercises: [
          fin("Burpee broad jump", "3", "5", "60 sec"),
        ],
      },
      cd(),
    ],
  },
  {
    variant: "home_weights",
    ageGroup: "16-18",
    phase: "foundation",
    workoutId: "A",
    title: "Lower Body and Power",
    sections: [
      wu(),
      {
        name: "Speed and Agility",
        exercises: [
          sa("Pogo hops", "3", "20", "30 sec"),
          sa("Skater jumps", "3", "6 each side", "30 sec"),
        ],
      },
      {
        name: "Strength (straight sets)",
        exercises: [
          ss("Goblet squat", "4", "10", "75 sec"),
          ss("Dumbbell RDL", "4", "10", "75 sec"),
          ss("Bulgarian split squat (holding the weight)", "3", "8 each leg", "75 sec"),
          ss("Single-leg glute bridge", "3", "10 each leg", "45 sec"),
        ],
      },
      {
        name: "Power",
        exercises: [
          sa("Stair drop to vertical jump", "3", "5", "60 sec"),
        ],
      },
      {
        name: "Pilates Core",
        exercises: [
          fin("Dead bug", "2", "10 each side", "-"),
          fin("Criss-cross", "2", "10 each side", "-"),
        ],
      },
      cd(),
    ],
  },
  {
    variant: "home_weights",
    ageGroup: "16-18",
    phase: "foundation",
    workoutId: "B",
    title: "Upper Body and Rotation",
    sections: [
      wu(),
      {
        name: "Speed and Agility",
        exercises: [
          sa("Hurdle hops (forward and back)", "3", "8", "30 sec"),
        ],
      },
      {
        name: "Strength (straight sets)",
        exercises: [
          ss("Single-arm row", "4", "10 each arm", "60 sec"),
          ss("Floor press", "4", "10", "60 sec"),
          ss("Pull-up / alt: Renegade row", "3", "5-8", "75 sec", "6 each arm"),
          ss("Half-kneeling single-arm press", "3", "8 each arm", "60 sec"),
          ss("Halo", "2", "6 each direction", "45 sec"),
        ],
      },
      {
        name: "Pilates Core",
        exercises: [
          fin("Pilates push-up", "3", "6", "-"),
          fin("Swimming", "3", "30 sec", "-"),
        ],
      },
      cd(),
    ],
  },
  {
    variant: "home_weights",
    ageGroup: "16-18",
    phase: "build",
    workoutId: "A",
    title: "Lower Body and Power",
    sections: [
      wu(),
      {
        name: "Speed and Agility",
        exercises: [
          sa("Pogo hops", "3", "25", "30 sec"),
          sa("Lateral single-leg hops", "3", "5 each leg", "45 sec"),
        ],
      },
      {
        name: "Circuit",
        rounds: 4,
        rest: "60 sec rest",
        exercises: [
          cex("Goblet squat", "12"),
          cex("Kettlebell swing", "15"),
          cex("Bulgarian split squat (holding the weight)", "8 each leg"),
          cex("Single-leg RDL (holding the weight)", "8 each leg"),
          cex("Plank shoulder taps", "24"),
        ],
      },
      {
        name: "Power",
        exercises: [
          sa("Stair drop to broad jump", "4", "4", "60 sec"),
          sa("Nordic hamstring lowers", "3", "4", "90 sec"),
        ],
      },
      {
        name: "Pilates Core",
        exercises: [
          fin("The hundred", "1", "100 count", "-"),
        ],
      },
      cd(),
    ],
  },
  {
    variant: "home_weights",
    ageGroup: "16-18",
    phase: "build",
    workoutId: "B",
    title: "Upper Body and Rotation",
    sections: [
      wu(),
      {
        name: "Speed and Agility",
        exercises: [
          sa("Lateral shuffle", "3", "5 steps each way, 2 times", "30 sec"),
        ],
      },
      {
        name: "Circuit",
        rounds: 4,
        rest: "60 sec rest",
        exercises: [
          cex("Pull-up / alt: Single-arm row", "6-10", "12 each arm"),
          cex("Floor press", "12"),
          cex("Push press", "8 each arm"),
          cex("Renegade row", "6 each arm"),
          cex("Halo", "8 each direction"),
          cex("Y-T-W raises", "10 each letter"),
        ],
      },
      {
        name: "Pilates Core",
        exercises: [
          fin("Plyo push-up", "3", "6", "-"),
          fin("Teaser", "2", "6", "-"),
        ],
      },
      cd(),
    ],
  },
  {
    variant: "home_weights",
    ageGroup: "16-18",
    phase: "compete",
    workoutId: "A",
    title: "Lower Body and Power",
    sections: [
      wu(),
      {
        name: "Speed and Agility",
        exercises: [
          sa("Single-leg hops", "3", "6 each leg", "45 sec"),
          sa("Hurdle hops (continuous)", "3", "8", "45 sec"),
        ],
      },
      {
        name: "Circuit",
        rounds: 4,
        rest: "60 sec rest",
        exercises: [
          cex("Kettlebell swing (explosive)", "20"),
          cex("Dumbbell jump squat (light)", "8"),
          cex("Bulgarian split squat (holding the weight)", "10 each leg"),
          cex("Weighted step-up", "8 each leg"),
          cex("Plank", "60 sec"),
        ],
      },
      {
        name: "Power",
        exercises: [
          sa("Broad jump to sprint", "5", "1", "45 sec"),
          sa("Nordic hamstring lowers", "3", "5", "90 sec"),
        ],
      },
      {
        name: "Finisher",
        exercises: [
          fin("Stair sprints", "3", "6 trips up", "walk down, 90 sec between sets"),
        ],
      },
      cd(),
    ],
  },
  {
    variant: "home_weights",
    ageGroup: "16-18",
    phase: "compete",
    workoutId: "B",
    title: "Upper Body and Rotation",
    sections: [
      wu(),
      {
        name: "Speed and Agility",
        exercises: [
          sa("Quick feet", "3", "15 sec", "30 sec"),
        ],
      },
      {
        name: "Circuit",
        rounds: 4,
        rest: "60 sec rest",
        exercises: [
          cex("Push press (explosive)", "8 each arm"),
          cex("Renegade row", "8 each arm"),
          cex("Plyo push-up", "8"),
          cex("Backpack woodchop (use the dumbbell)", "10 each side"),
          cex("Suitcase carry", "50 feet each side"),
        ],
      },
      {
        name: "Pilates Core",
        exercises: [
          fin("Swimming", "3", "40 sec", "-"),
          fin("Teaser", "3", "6", "-"),
        ],
      },
      {
        name: "Finisher",
        exercises: [
          fin("Burpee broad jump", "4", "5", "60 sec"),
        ],
      },
      cd(),
    ],
  },
];
