import {
  buildOptionOrderForAttempt,
  getLowestPlayerIqCategory,
  getPlayerIqLevelForScore,
  scorePlayerIqQuiz,
  shuffleOptionIds,
  getPlayerIqCta,
  getPlayerIqLevelMessage,
  PLAYER_IQ_QUESTIONS,
} from "../lib/player-iq-quiz-shared";

function assertLevelBoundaries() {
  if (getPlayerIqLevelForScore(5) !== "ROOKIE") {
    throw new Error("Score 5 should be ROOKIE");
  }
  if (getPlayerIqLevelForScore(6) !== "STARTER") {
    throw new Error("Score 6 should be STARTER");
  }
  if (getPlayerIqLevelForScore(9) !== "STARTER") {
    throw new Error("Score 9 should be STARTER");
  }
  if (getPlayerIqLevelForScore(10) !== "ALL_CONFERENCE") {
    throw new Error("Score 10 should be ALL_CONFERENCE");
  }
  if (getPlayerIqLevelForScore(12) !== "ALL_CONFERENCE") {
    throw new Error("Score 12 should be ALL_CONFERENCE");
  }
  if (getPlayerIqLevelForScore(13) !== "MEMORABLE") {
    throw new Error("Score 13 should be MEMORABLE");
  }
}

function assertCategoryTieBreak() {
  const tied = getLowestPlayerIqCategory({ mindset: 3, gameIq: 3, training: 4 });
  if (tied !== "mindset") {
    throw new Error("Tie-break should prefer Mindset");
  }
  const gameTie = getLowestPlayerIqCategory({ mindset: 4, gameIq: 2, training: 2 });
  if (gameTie !== "gameIq") {
    throw new Error("Tie-break should prefer Game IQ over Training");
  }
}

function assertShuffleAndScoring() {
  const question = PLAYER_IQ_QUESTIONS[0]!;
  const ids = question.options.map((option) => option.id);
  const shuffled = shuffleOptionIds(ids, "test-seed");
  if (shuffled.length !== ids.length) {
    throw new Error("Shuffle should preserve option count");
  }
  const setA = new Set(ids);
  const setB = new Set(shuffled);
  if (ids.some((id) => !setB.has(id)) || shuffled.some((id) => !setA.has(id))) {
    throw new Error("Shuffle should preserve option ids");
  }

  const answers: Record<string, string> = {};
  for (const q of PLAYER_IQ_QUESTIONS) {
    answers[q.id] = q.correctOptionId;
  }
  const perfect = scorePlayerIqQuiz(answers);
  if (perfect.score !== 15 || perfect.level !== "MEMORABLE") {
    throw new Error("Perfect answers should score 15 MEMORABLE");
  }

  const order = buildOptionOrderForAttempt("attempt-test-1");
  if (!order.q1 || order.q1.length !== 4) {
    throw new Error("Option order should include all questions");
  }
}

function assertRoleMessages() {
  const rookiePlayer = getPlayerIqLevelMessage("ROOKIE", "PLAYER");
  if (!rookiePlayer.includes("free breakdown")) {
    throw new Error("Rookie player message missing swing CTA language");
  }
  const cta = getPlayerIqCta("ALL_CONFERENCE", "PLAYER");
  if (!cta.primaryHref.includes("workout-starters")) {
    throw new Error("All-Conference player CTA should point to starters");
  }
  const coachCta = getPlayerIqCta("ROOKIE", "COACH");
  if (coachCta.primaryHref !== "calendly") {
    throw new Error("Coach CTA should use calendly routing");
  }
}

function assertCompletedAttemptShape() {
  const answers: Record<string, string> = {};
  for (const q of PLAYER_IQ_QUESTIONS) {
    answers[q.id] = q.options[0]!.id;
  }
  const result = scorePlayerIqQuiz(answers);
  if (typeof result.score !== "number" || !result.level) {
    throw new Error("Score result missing fields");
  }
  if (result.categoryScores.mindset + result.categoryScores.gameIq + result.categoryScores.training !== result.score) {
    throw new Error("Category scores should sum to total score");
  }
}

assertLevelBoundaries();
assertCategoryTieBreak();
assertShuffleAndScoring();
assertRoleMessages();
assertCompletedAttemptShape();

console.log("Player IQ quiz tests passed.");
