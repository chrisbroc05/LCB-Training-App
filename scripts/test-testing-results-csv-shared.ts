import assert from "node:assert/strict";
import {
  RESULTS_CSV_METRIC_DEFINITIONS,
  parseResultsCsvTestDate,
  parseResultsCsvText,
} from "../lib/testing-results-csv-shared";

assert.equal(parseResultsCsvTestDate("2026-03-15"), "2026-03-15");
assert.equal(parseResultsCsvTestDate("3/15/2026"), "2026-03-15");
assert.equal(parseResultsCsvTestDate("bad"), null);

const mappingByColumn = Object.fromEntries(
  RESULTS_CSV_METRIC_DEFINITIONS.map((definition) => [definition.csvColumn, definition]),
);
assert.equal(mappingByColumn.ten_yard_sec.metricKey, "ten_yard");
assert.equal(mappingByColumn.ten_yard_sec.label, "10-Yard Sprint");
assert.equal(mappingByColumn.thirty_yard_sec.metricKey, "thirty_yard");
assert.equal(mappingByColumn.sixty_yard_sec.metricKey, "sixty_yard");
assert.equal(mappingByColumn.shuttle_5_10_5_sec.metricKey, "pro_agility");
assert.equal(mappingByColumn.broad_jump_in.metricKey, "broad_jump");
assert.equal(mappingByColumn.exit_velo_mph.metricKey, "exit_velo_tee");
assert.equal(mappingByColumn.exit_velo_mph.label, "Exit Velo (Tee)");
assert.equal(mappingByColumn.bat_speed_mph.metricKey, "bat_speed");
assert.equal(mappingByColumn.bat_speed_mph.label, "Bat Speed");
assert.equal(mappingByColumn.pulldown_velo_mph.metricKey, "pulldown_velo");
assert.equal(mappingByColumn.pulldown_velo_mph.stationLabel, "Throwing");

const csvWithLegacyJersey = [
  "team,test_date,first_name,last_name,jersey,ten_yard_sec,thirty_yard_sec,sixty_yard_sec,shuttle_5_10_5_sec,broad_jump_in,exit_velo_mph,pulldown_velo_mph",
  "NWT/RAGE 16U White,2026-03-15,AJ,Fong,12,1.70,,7.80,4.55,96,82.5,",
  "NWT/RAGE 16U White,3/15/2026,New,Player,,1.80,4.10,,,,,",
].join("\n");

const parsed = parseResultsCsvText(csvWithLegacyJersey);
if (!parsed.ok) {
  assert.fail(parsed.error);
}
assert.equal(parsed.rows.length, 2);
assert.equal(parsed.rows[0].metrics.ten_yard_sec, 1.7);
assert.equal(parsed.rows[0].metrics.thirty_yard_sec, undefined);
assert.equal(parsed.rows[0].metrics.broad_jump_in, 96);
assert.equal(parsed.rows[1].testDate, "2026-03-15");

const csvWithoutJersey = [
  "team,test_date,first_name,last_name,ten_yard_sec,thirty_yard_sec,sixty_yard_sec,shuttle_5_10_5_sec,broad_jump_in,exit_velo_mph,pulldown_velo_mph",
  "NWT/RAGE 16U White,2026-03-15,AJ,Fong,1.70,,,,,,",
].join("\n");
const parsedNoJersey = parseResultsCsvText(csvWithoutJersey);
if (!parsedNoJersey.ok) {
  assert.fail(parsedNoJersey.error);
}
assert.equal(parsedNoJersey.rows.length, 1);

const missingTeam = parseResultsCsvText(
  "test_date,first_name,last_name,ten_yard_sec,thirty_yard_sec,sixty_yard_sec,shuttle_5_10_5_sec,broad_jump_in,exit_velo_mph,pulldown_velo_mph\n2026-03-15,A,B,1,,,,,,",
);
assert.equal(missingTeam.ok, false);

const identityOnly = parseResultsCsvText(
  "team,test_date,first_name,last_name\nNWT/RAGE 16U White,2026-03-15,AJ,Fong",
);
if (!identityOnly.ok) {
  assert.fail(identityOnly.error);
}
assert.equal(identityOnly.rows.length, 1);
assert.equal(Object.keys(identityOnly.rows[0].metrics).length, 0);

const withBatSpeed = parseResultsCsvText(
  "team,test_date,first_name,last_name,exit_velo_mph,bat_speed_mph\nNWT/RAGE 16U White,2026-03-15,AJ,Fong,82.5,68.0",
);
if (!withBatSpeed.ok) {
  assert.fail(withBatSpeed.error);
}
assert.equal(withBatSpeed.rows[0].metrics.exit_velo_mph, 82.5);
assert.equal(withBatSpeed.rows[0].metrics.bat_speed_mph, 68);
assert.deepEqual(withBatSpeed.unrecognizedHeaders, []);
assert.deepEqual(withBatSpeed.warnings, []);

const withUnknown = parseResultsCsvText(
  "team,test_date,first_name,last_name,mystery_col,exit_velo_mph\nNWT/RAGE 16U White,2026-03-15,AJ,Fong,x,80",
);
if (!withUnknown.ok) {
  assert.fail(withUnknown.error);
}
assert.deepEqual(withUnknown.unrecognizedHeaders, ["mystery_col"]);
assert.equal(withUnknown.warnings.length, 1);
assert.match(withUnknown.warnings[0], /mystery_col/);

const withJerseyOnly = parseResultsCsvText(
  "team,test_date,first_name,last_name,jersey\nNWT/RAGE 16U White,2026-03-15,AJ,Fong,12",
);
if (!withJerseyOnly.ok) {
  assert.fail(withJerseyOnly.error);
}
assert.deepEqual(withJerseyOnly.unrecognizedHeaders, []);
assert.deepEqual(withJerseyOnly.warnings, []);

console.log("test-testing-results-csv-shared: ok");
