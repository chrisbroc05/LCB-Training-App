import assert from "node:assert/strict";
import {
  resolveExerciseDrillVimeoId,
  SPEED_AGILITY_DRILL_IDS,
} from "../lib/workout-exercise-drill-shared";

function main() {
  assert.equal(
    resolveExerciseDrillVimeoId("Pogo hops", "12-15"),
    SPEED_AGILITY_DRILL_IDS.pogoHops,
  );
  assert.equal(
    resolveExerciseDrillVimeoId("Broad Jump", "8-11"),
    SPEED_AGILITY_DRILL_IDS.tripleBroadJumps,
  );
  assert.equal(
    resolveExerciseDrillVimeoId("Ladder - Icky Shuffle", "8-11"),
    SPEED_AGILITY_DRILL_IDS.quickFeetCircuit,
  );
  assert.equal(
    resolveExerciseDrillVimeoId("Skater Jump", "8-11"),
    SPEED_AGILITY_DRILL_IDS.skaterJumps,
  );
  assert.equal(
    resolveExerciseDrillVimeoId("Wall Drill (single-leg drive)", "12-15"),
    SPEED_AGILITY_DRILL_IDS.speedStartsWithArms,
  );
  assert.equal(
    resolveExerciseDrillVimeoId("Box Jump", "8-11"),
    SPEED_AGILITY_DRILL_IDS.seatedBoxJumps,
  );
  assert.equal(
    resolveExerciseDrillVimeoId("Stair drop to broad jump", "12-15"),
    SPEED_AGILITY_DRILL_IDS.depthDropDoubleBroad,
  );
  assert.equal(
    resolveExerciseDrillVimeoId("Stair drop to vertical jump", "12-15"),
    SPEED_AGILITY_DRILL_IDS.depthJumps,
  );
  assert.equal(resolveExerciseDrillVimeoId("Stair drop to broad jump", "8-11"), null);
  assert.equal(resolveExerciseDrillVimeoId("Depth Jumps", "8-11"), null);
  assert.equal(
    resolveExerciseDrillVimeoId("Weighted Skater Jumps", "16-18"),
    SPEED_AGILITY_DRILL_IDS.weightedSkaterJumps,
  );
  assert.equal(resolveExerciseDrillVimeoId("Weighted Skater Jumps", "12-15"), null);
  assert.equal(resolveExerciseDrillVimeoId("Box Drill (4-cone)", "12-15"), null);

  console.log("test-workout-exercise-drill-shared: all passed");
}

main();
