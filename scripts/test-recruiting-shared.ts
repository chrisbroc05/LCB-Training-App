import assert from "node:assert/strict";
import {
  buildRecruitingCopyForResearch,
  emptyRecruitingAnswers,
  isRecruitingWaitingOnList,
} from "../lib/recruiting-shared";

const answers = {
  ...emptyRecruitingAnswers(),
  gradYear: 2027,
  primaryPosition: "Shortstop",
  levelsOpenTo: ["D3", "NAIA"],
  locationPreference: "MIDWEST",
  schoolSize: "MEDIUM",
  scholarshipImportance: "SOMEWHAT",
};

const copy = buildRecruitingCopyForResearch({
  firstName: "Patrick",
  ageGroupLabel: "16-18",
  profile: answers,
});

assert.ok(copy.includes("Player: Patrick"));
assert.ok(copy.includes("Age group: 16-18"));
assert.ok(copy.includes("Grad year: 2027"));
assert.ok(copy.includes("Levels open to: D3, NAIA"));
assert.ok(!copy.toLowerCase().includes("email"));
assert.ok(!copy.toLowerCase().includes("phone"));

assert.equal(
  isRecruitingWaitingOnList({ enabled: true, coachSchoolList: null }),
  true,
);
assert.equal(
  isRecruitingWaitingOnList({ enabled: true, coachSchoolList: " - School A" }),
  false,
);
assert.equal(
  isRecruitingWaitingOnList({ enabled: false, coachSchoolList: null }),
  false,
);

console.log("test-recruiting-shared: ok");
