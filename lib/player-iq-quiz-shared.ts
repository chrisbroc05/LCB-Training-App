import type { LeadRoleValue } from "@/lib/resources-shared";

export const PLAYER_IQ_QUIZ_RESOURCE_SLUG = "player-iq-quiz";

export const PLAYER_IQ_QUIZ_CARD_TITLE = "The Player IQ Quiz";

export const PLAYER_IQ_QUIZ_CARD_DESCRIPTION =
  "15 questions on mindset, game situations, and training. Most players don't score as high as they think. See where you stand.";

export const PLAYER_IQ_QUIZ_LANDING_SUBLINE = "15 questions, about 5 minutes";

export type PlayerIqCategory = "mindset" | "gameIq" | "training";

export type PlayerIqDifficulty = "easy" | "medium" | "hard";

export type PlayerIqLevel = "ROOKIE" | "STARTER" | "ALL_CONFERENCE" | "MEMORABLE";

export type PlayerIqQuestionOption = {
  id: string;
  text: string;
};

export type PlayerIqQuestionDefinition = {
  id: string;
  order: number;
  category: PlayerIqCategory;
  categoryLabel: string;
  difficulty: PlayerIqDifficulty;
  prompt: string;
  options: PlayerIqQuestionOption[];
  correctOptionId: string;
  why: string;
  sourceUrl?: string;
};

export const PLAYER_IQ_CATEGORY_LABELS: Record<PlayerIqCategory, string> = {
  mindset: "Mindset",
  gameIq: "Game IQ",
  training: "Training",
};

export const PLAYER_IQ_CATEGORY_TIPS: Record<PlayerIqCategory, string> = {
  mindset:
    "The mental side is where the best players separate themselves. Start with how you respond to a bad day.",
  gameIq:
    "Knowing the situation before every pitch wins games. Before each pitch, ask yourself: what's my job right now?",
  training:
    "A lot of what players hear about training is outdated. Train with a plan, not with myths.",
};

export const PLAYER_IQ_LEVEL_BANDS: { min: number; max: number; level: PlayerIqLevel }[] = [
  { min: 0, max: 5, level: "ROOKIE" },
  { min: 6, max: 9, level: "STARTER" },
  { min: 10, max: 12, level: "ALL_CONFERENCE" },
  { min: 13, max: 15, level: "MEMORABLE" },
];

export const PLAYER_IQ_LEVEL_DISPLAY: Record<PlayerIqLevel, string> = {
  ROOKIE: "ROOKIE",
  STARTER: "STARTER",
  ALL_CONFERENCE: "ALL-CONFERENCE",
  MEMORABLE: "MEMORABLE",
};

const LEVEL_MESSAGES: Record<
  PlayerIqLevel,
  Record<LeadRoleValue, string>
> = {
  ROOKIE: {
    PLAYER:
      "You've got the drive. Now it's time to learn what great players know. Start with one thing: send me your swing for a free breakdown.",
    PARENT:
      "Your player has the drive. Now it's about learning what great players know. A free swing breakdown from me is a great first step.",
    COACH:
      "Some of these might be worth a closer look with your team. I'd love to help.",
  },
  STARTER: {
    PLAYER:
      "Solid base, but you're guessing on some things. Let's fill in the gaps. Start with a free swing breakdown from me.",
    PARENT:
      "Your player has a solid base with a few gaps. A free swing breakdown is the fastest way to see where to focus.",
    COACH: "Solid base. A few of these are great teaching points for your players.",
  },
  ALL_CONFERENCE: {
    PLAYER:
      "You know the game. Now it's about doing it every single day. My 4-week starters give you a plan for the days between practices.",
    PARENT:
      "Your player knows the game. Now it's about putting in the work every day. A 4-week starter gives them a plan for the days between practices.",
    COACH: "You know your stuff. Imagine every player on your roster scoring like this.",
  },
  MEMORABLE: {
    PLAYER:
      "You think like a great player. Let's make sure your work matches. That's what my 12-Week Program is built for.",
    PARENT:
      "Your player thinks like a great player. The 12-Week Program makes sure their daily work matches.",
    COACH:
      "You think like a great coach. Let's talk about what this could look like for your whole program.",
  },
};

export type PlayerIqCta = {
  primaryLabel: string;
  primaryHref: string;
  secondaryLine?: string;
};

export function getPlayerIqLevelMessage(level: PlayerIqLevel, role: LeadRoleValue) {
  return LEVEL_MESSAGES[level][role];
}

export function getPlayerIqCta(level: PlayerIqLevel, role: LeadRoleValue): PlayerIqCta {
  if (role === "COACH") {
    return {
      primaryLabel: "Book a Call About Your Team",
      primaryHref: "calendly",
      secondaryLine: "I partner with clubs and teams on player development.",
    };
  }

  if (level === "ROOKIE" || level === "STARTER") {
    return {
      primaryLabel: "Get My Free Swing Analysis",
      primaryHref: "free-swing-analysis",
    };
  }

  if (level === "ALL_CONFERENCE") {
    return {
      primaryLabel: "See the 4-Week Starters",
      primaryHref: "/resources#workout-starters",
    };
  }

  return {
    primaryLabel: "See the 12-Week Program",
    primaryHref: "/program",
    secondaryLine: "Use code STARTER25 for $25 off.",
  };
}

export const PLAYER_IQ_QUESTIONS: PlayerIqQuestionDefinition[] = [
  {
    id: "q1",
    order: 1,
    category: "mindset",
    categoryLabel: "Mindset",
    difficulty: "medium",
    prompt:
      "Lessons and practice are 1 or 2 days a week. What's the best use of the other days?",
    options: [
      { id: "q1-a", text: "Rest until your next lesson so you don't overdo it" },
      {
        id: "q1-b",
        text: "Work on 1 or 2 things from your lesson every day, with one rest day",
      },
      { id: "q1-c", text: "Try to fix everything at once so you improve faster" },
      { id: "q1-d", text: "Only train when you have a game coming up" },
    ],
    correctOptionId: "q1-b",
    why: "Lessons are one day a week. What happens the other six is what separates players. Take one or two things you learned, work on them every day, and get 1% better. One rest day is part of the plan.",
  },
  {
    id: "q2",
    order: 2,
    category: "gameIq",
    categoryLabel: "Game IQ",
    difficulty: "easy",
    prompt: "Runner on second, nobody out. As the hitter, what's your main job?",
    options: [
      { id: "q2-a", text: "Try to drive the ball out of the park" },
      {
        id: "q2-b",
        text: "Move the runner to third, ideally by hitting the ball to the right side",
      },
      { id: "q2-c", text: "Pull a hard ground ball to the left side" },
      { id: "q2-d", text: "Take pitches and try to draw a walk" },
    ],
    correctOptionId: "q2-b",
    why: "With nobody out, getting that runner to third means he can score on a fly ball, a ground ball, or a wild pitch. A ball hit to the right side is behind him, so he can advance. A ground ball to the left side usually freezes him at second.",
  },
  {
    id: "q3",
    order: 3,
    category: "training",
    categoryLabel: "Training",
    difficulty: "hard",
    prompt: "Does swinging a weighted donut on deck make your game swing faster?",
    options: [
      { id: "q3-a", text: "Yes, by about 5 mph" },
      { id: "q3-b", text: "Yes, a little" },
      { id: "q3-c", text: "No. Research found it doesn't increase bat speed" },
      { id: "q3-d", text: "Only for older, stronger players" },
    ],
    correctOptionId: "q3-c",
    why: "A study of Division I hitters tested 10 warm-up devices, including donuts and weighted wraps. None of them increased bat speed compared to warming up with the game bat. It may feel faster, but the numbers say otherwise.",
    sourceUrl:
      "https://www.newswise.com/articles/for-hitters-on-deck-warm-up-devices-don-t-increase-bat-speed",
  },
  {
    id: "q4",
    order: 4,
    category: "mindset",
    categoryLabel: "Mindset",
    difficulty: "medium",
    prompt: "You go 0-for-4 with 3 strikeouts. What's the best thing to do before your next game?",
    options: [
      { id: "q4-a", text: "Take 200 extra swings that night until it feels right" },
      { id: "q4-b", text: "Change your stance before the next game" },
      {
        id: "q4-c",
        text: "Process it, learn from it, let it go, and picture yourself having success",
      },
      { id: "q4-d", text: "Avoid thinking about it at all so it doesn't get in your head" },
    ],
    correctOptionId: "q4-c",
    why: "Give yourself a little time to process it and learn what went wrong. Then have a short memory. See yourself having success in your next game before you step on the field.",
  },
  {
    id: "q5",
    order: 5,
    category: "gameIq",
    categoryLabel: "Game IQ",
    difficulty: "easy",
    prompt: "Runner on third, one out. As the hitter, what's your main goal?",
    options: [
      { id: "q5-a", text: "Swing for a home run" },
      { id: "q5-b", text: "Hit a fly ball to the outfield or put a hard ball in play" },
      { id: "q5-c", text: "Hit a soft ground ball to third base" },
      { id: "q5-d", text: "Take every pitch until you get to two strikes" },
    ],
    correctOptionId: "q5-b",
    why: "With one out, a fly ball deep enough to the outfield scores him on a tag-up, and a hard ball in play gives him a chance. A soft ground ball to third almost never scores the run.",
  },
  {
    id: "q6",
    order: 6,
    category: "training",
    categoryLabel: "Training",
    difficulty: "easy",
    prompt: "Does lifting weights stunt a young athlete's growth?",
    options: [
      { id: "q6-a", text: "Yes, it damages growth plates" },
      { id: "q6-b", text: "Only if you start before age 16" },
      {
        id: "q6-c",
        text: "No. Coached training with good form has not been shown to stunt growth",
      },
      { id: "q6-d", text: "Only if you lift more than your bodyweight" },
    ],
    correctOptionId: "q6-c",
    why: "It's one of the biggest myths in youth sports. The American Academy of Pediatrics says well-designed, supervised programs have not been shown to hurt growth. Start light, focus on form, and build the foundation. Leave the ego at the door.",
    sourceUrl: "https://www.strongerbyscience.com/will-lifting-stunt-childrens-growth/",
  },
  {
    id: "q7",
    order: 7,
    category: "mindset",
    categoryLabel: "Mindset",
    difficulty: "easy",
    prompt: "You strike out looking on a close pitch. What's the best way to handle the walk back?",
    options: [
      { id: "q7-a", text: "Show the umpire you disagree so he gets the next one right" },
      { id: "q7-b", text: "Keep your head down so nobody sees you're upset" },
      {
        id: "q7-c",
        text: "Shoulders back, chest up, process it, and get ready for your next one",
      },
      { id: "q7-d", text: "Slam your bat so your team knows you care" },
    ],
    correctOptionId: "q7-c",
    why: "Everyone is watching your body language, including the other dugout. Carry yourself the same whether you get a hit or strike out. Process it, then move on.",
  },
  {
    id: "q8",
    order: 8,
    category: "gameIq",
    categoryLabel: "Game IQ",
    difficulty: "medium",
    prompt: "Runner on second, one out, deep fly ball to right field. What should the runner do?",
    options: [
      { id: "q8-a", text: "Run on contact" },
      { id: "q8-b", text: "Go halfway and wait" },
      { id: "q8-c", text: "Tag up and go to third after the catch" },
      { id: "q8-d", text: "Stay at second no matter what" },
    ],
    correctOptionId: "q8-c",
    why: "On a deep fly ball with less than two outs, the runner tags up. Once it's caught, he can take third easily, since right field is the longest throw to third base. Halfway is for shallow or uncertain fly balls.",
  },
  {
    id: "q9",
    order: 9,
    category: "training",
    categoryLabel: "Training",
    difficulty: "hard",
    prompt:
      "To hit more line drives and hard fly balls, how should the bat be moving at contact?",
    options: [
      { id: "q9-a", text: "Down on the ball" },
      { id: "q9-b", text: "Perfectly level" },
      { id: "q9-c", text: "Slightly upward, about 5 to 20 degrees" },
      { id: "q9-d", text: "Steeply upward, more than 30 degrees" },
    ],
    correctOptionId: "q9-c",
    why: "The pitch comes in on a downward angle. A bat moving slightly upward through the zone matches it, which is why Statcast lists 5 to 20 degrees as the ideal attack angle. Those swings produce the most line drives and extra-base hits.",
    sourceUrl: "https://www.mlb.com/glossary/statcast/ideal-attack-angle",
  },
  {
    id: "q10",
    order: 10,
    category: "mindset",
    categoryLabel: "Mindset",
    difficulty: "easy",
    prompt: "Before you ever take a swing, what do coaches notice first?",
    options: [
      { id: "q10-a", text: "How hard you throw in warm-ups" },
      { id: "q10-b", text: "Your gear and how you wear your uniform" },
      {
        id: "q10-c",
        text: "Being on time, looking them in the eye, and hustling on and off the field",
      },
      { id: "q10-d", text: "How loud you are in the dugout" },
    ],
    correctOptionId: "q10-c",
    why: "Stats come and go. Coaches remember the player who is on time, cares, asks good questions, hustles, runs out every ground ball, and never takes a play off. What do you want to be known for?",
  },
  {
    id: "q11",
    order: 11,
    category: "gameIq",
    categoryLabel: "Game IQ",
    difficulty: "hard",
    prompt:
      "Runners on first and second, one out. The batter hits a high pop-up to the shortstop. What happens?",
    options: [
      { id: "q11-a", text: "The shortstop should let it drop to turn a double play" },
      { id: "q11-b", text: "The batter is automatically out under the infield fly rule" },
      { id: "q11-c", text: "Both runners must run to the next base" },
      { id: "q11-d", text: "The play is dead and the batter hits again" },
    ],
    correctOptionId: "q11-b",
    why: "The infield fly rule applies with runners on first and second (or bases loaded), fewer than two outs, and a fair fly ball an infielder can catch with ordinary effort. The batter is out, and the runners don't have to run. The rule exists so the defense can't drop it on purpose for a cheap double play.",
    sourceUrl: "https://www.littleleague.org/university/articles/explanation-infield-fly-rule",
  },
  {
    id: "q12",
    order: 12,
    category: "training",
    categoryLabel: "Training",
    difficulty: "medium",
    prompt: "What's the best way to warm up before a game?",
    options: [
      { id: "q12-a", text: "Long static stretches, holding each one a minute or more" },
      { id: "q12-b", text: "A dynamic warm-up that builds from light movement to game speed" },
      { id: "q12-c", text: "Skip it to save energy for the game" },
      { id: "q12-d", text: "Go straight into max-effort sprints" },
    ],
    correctOptionId: "q12-b",
    why: "Long static stretch holds right before playing can lower your power. A dynamic warm-up raises your body temperature and gets your muscles ready to move fast. Short stretches can be part of it, as long as you build up to game speed.",
    sourceUrl: "https://www.frontiersin.org/articles/10.3389/fphys.2019.01468/full",
  },
  {
    id: "q13",
    order: 13,
    category: "mindset",
    categoryLabel: "Mindset",
    difficulty: "medium",
    prompt: "What makes a cage session most productive?",
    options: [
      { id: "q13-a", text: "High volume, 150+ swings, to build muscle memory" },
      {
        id: "q13-b",
        text: "Fewer swings, each with a goal, and knowing why it worked or didn't",
      },
      { id: "q13-c", text: "Swinging as hard as you can on every rep" },
      { id: "q13-d", text: "Hitting until your hands are sore" },
    ],
    correctOptionId: "q13-b",
    why: "Every swing should have intent and a result you're going for. If it doesn't happen, know why and make an adjustment. That's how practice turns into games.",
  },
  {
    id: "q14",
    order: 14,
    category: "gameIq",
    categoryLabel: "Game IQ",
    difficulty: "hard",
    prompt:
      "After a 2-1 count, MLB hitters get on base about 38% of the time. After a 1-2 count, it's about:",
    options: [
      { id: "q14-a", text: "35%" },
      { id: "q14-b", text: "30%" },
      { id: "q14-c", text: "23%" },
      { id: "q14-d", text: "10%" },
    ],
    correctOptionId: "q14-c",
    why: "About 23%. One pitch can flip the whole at-bat. Win the 1-1 pitch.",
    sourceUrl:
      "https://www.lookoutlanding.com/2015/12/30/10689982/c-the-z-what-happens-after-the-most-important-count",
  },
  {
    id: "q15",
    order: 15,
    category: "training",
    categoryLabel: "Training",
    difficulty: "medium",
    prompt: "Which has the biggest effect on how hard you hit the ball?",
    options: [
      { id: "q15-a", text: "A faster pitch" },
      { id: "q15-b", text: "More bat speed" },
      { id: "q15-c", text: "A heavier bat" },
      { id: "q15-d", text: "A longer bat" },
    ],
    correctOptionId: "q15-b",
    why: "The physics shows that a change in bat speed has a bigger effect on how hard the ball comes off the bat than the same change in pitch speed. That's why training bat speed matters so much.",
    sourceUrl: "https://www.acs.psu.edu/drussell/bats/besr.html",
  },
];

const QUESTION_BY_ID = new Map(PLAYER_IQ_QUESTIONS.map((question) => [question.id, question]));

export function getPlayerIqQuestion(questionId: string) {
  return QUESTION_BY_ID.get(questionId);
}

export function shuffleOptionIds(optionIds: string[], seed: string) {
  const copy = [...optionIds];
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }
  for (let index = copy.length - 1; index > 0; index -= 1) {
    hash = (hash * 1664525 + 1013904223) >>> 0;
    const swapIndex = hash % (index + 1);
    const temp = copy[index];
    copy[index] = copy[swapIndex]!;
    copy[swapIndex] = temp!;
  }
  return copy;
}

export function buildOptionOrderForAttempt(attemptId: string) {
  const order: Record<string, string[]> = {};
  for (const question of PLAYER_IQ_QUESTIONS) {
    order[question.id] = shuffleOptionIds(
      question.options.map((option) => option.id),
      `${attemptId}:${question.id}`,
    );
  }
  return order;
}

export function getOptionsForQuestionInOrder(
  question: PlayerIqQuestionDefinition,
  optionOrder: Record<string, string[]>,
) {
  const ids = optionOrder[question.id] ?? question.options.map((option) => option.id);
  return ids
    .map((id) => question.options.find((option) => option.id === id))
    .filter((option): option is PlayerIqQuestionOption => Boolean(option));
}

export type PlayerIqAnswers = Record<string, string>;

export type PlayerIqCategoryScores = Record<PlayerIqCategory, number>;

export function scorePlayerIqQuiz(answers: PlayerIqAnswers) {
  let score = 0;
  const categoryScores: PlayerIqCategoryScores = {
    mindset: 0,
    gameIq: 0,
    training: 0,
  };

  for (const question of PLAYER_IQ_QUESTIONS) {
    const selected = answers[question.id];
    if (selected === question.correctOptionId) {
      score += 1;
      categoryScores[question.category] += 1;
    }
  }

  const level = getPlayerIqLevelForScore(score);
  const lowestCategory = getLowestPlayerIqCategory(categoryScores);

  return { score, categoryScores, level, lowestCategory };
}

export function getPlayerIqLevelForScore(score: number): PlayerIqLevel {
  const band = PLAYER_IQ_LEVEL_BANDS.find(
    (entry) => score >= entry.min && score <= entry.max,
  );
  return band?.level ?? "ROOKIE";
}

export function getLowestPlayerIqCategory(
  categoryScores: PlayerIqCategoryScores,
): PlayerIqCategory {
  const order: PlayerIqCategory[] = ["mindset", "gameIq", "training"];
  let lowest = order[0]!;
  let lowestScore = categoryScores[lowest];
  for (const category of order) {
    if (categoryScores[category] < lowestScore) {
      lowest = category;
      lowestScore = categoryScores[category];
    }
  }
  return lowest;
}

export function getOptionText(questionId: string, optionId: string) {
  const question = getPlayerIqQuestion(questionId);
  return question?.options.find((option) => option.id === optionId)?.text ?? optionId;
}

export function getAnswerFeedback(questionId: string, selectedOptionId: string) {
  const question = getPlayerIqQuestion(questionId);
  if (!question) {
    return null;
  }
  const correct = selectedOptionId === question.correctOptionId;
  return {
    correct,
    correctOptionId: question.correctOptionId,
    correctOptionText: getOptionText(questionId, question.correctOptionId),
    selectedOptionText: getOptionText(questionId, selectedOptionId),
    why: question.why,
    sourceUrl: question.sourceUrl,
  };
}

export function formatCategoryBreakdown(categoryScores: PlayerIqCategoryScores) {
  return `Mindset ${categoryScores.mindset}/5, Game IQ ${categoryScores.gameIq}/5, Training ${categoryScores.training}/5`;
}

export function buildResultsTitle(firstName: string, score: number, level: PlayerIqLevel) {
  return `${firstName}, you scored ${score}/15: ${PLAYER_IQ_LEVEL_DISPLAY[level]}`;
}

export const PLAYER_IQ_SHARE_TEXT =
  "I scored [X]/15 on Coach Broc's Player IQ Quiz. Think you can beat it?";

export function buildShareMessage(score: number) {
  return PLAYER_IQ_SHARE_TEXT.replace("[X]", String(score));
}
