import {
  aggregateGameStats,
  computeAvg,
  computeObp,
  computeSlg,
  formatGameLine,
  formatRate,
  validateGameStats,
} from "../lib/program-stats";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

const valid = validateGameStats({
  atBats: 4,
  hits: 2,
  doubles: 1,
  triples: 0,
  homeRuns: 0,
  walks: 1,
  hitByPitch: 0,
  runs: 1,
  rbis: 1,
  strikeouts: 1,
  stolenBases: 0,
  errors: 0,
});
assert(valid.ok, "Expected valid stats");

const invalidHits = validateGameStats({
  atBats: 3,
  hits: 4,
  doubles: 0,
  triples: 0,
  homeRuns: 0,
  walks: 0,
  hitByPitch: 0,
  runs: 0,
  rbis: 0,
  strikeouts: 0,
  stolenBases: 0,
  errors: 0,
});
assert(!invalidHits.ok, "Expected hits <= atBats validation");

const totals = aggregateGameStats([
  {
    atBats: 4,
    hits: 2,
    doubles: 1,
    triples: 0,
    homeRuns: 0,
    walks: 1,
    hitByPitch: 0,
    runs: 1,
    rbis: 1,
    strikeouts: 1,
    stolenBases: 1,
    errors: 0,
  },
  {
    atBats: 3,
    hits: 1,
    doubles: 0,
    triples: 0,
    homeRuns: 1,
    walks: 0,
    hitByPitch: 1,
    runs: 2,
    rbis: 2,
    strikeouts: 2,
    stolenBases: 0,
    errors: 1,
  },
]);

assert(totals.games === 2, "Expected 2 games");
assert(totals.atBats === 7, "Expected 7 AB");
assert(totals.hits === 3, "Expected 3 H");

assert(formatRate(computeAvg(totals)) === ".429", "Expected .429 AVG");
assert(formatRate(computeObp(totals)) === ".556", "Expected .556 OBP");
assert(formatRate(computeSlg(totals)) === "1.000", "Expected 1.000 SLG");
assert(formatRate(computeAvg({ hits: 0, atBats: 0 })) === ".000", "Expected .000 AVG");

const line = formatGameLine({
  atBats: 4,
  hits: 2,
  doubles: 0,
  triples: 0,
  homeRuns: 0,
  walks: 1,
  hitByPitch: 0,
  runs: 0,
  rbis: 1,
  strikeouts: 0,
  stolenBases: 0,
  errors: 0,
});
assert(line === "2 for 4, 1 BB, 1 RBI", `Unexpected line: ${line}`);

console.log("Program stats self-tests passed.");
