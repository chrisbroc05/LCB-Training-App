/**
 * Deprecated: org team pick nudges run from Admin > Organizations > [org] >
 * "No team picked" > "Send team reminder".
 *
 * This script refuses production and exits. Do not use it to send.
 */

import { assertDevOnlyScript } from "../lib/dev-script-guard-shared";

assertDevOnlyScript("scripts/org-team-pick-nudge.ts");

console.error(
  [
    "org-team-pick-nudge: removed as a send path.",
    "Use Admin > Organizations > [org] > No team picked > Send team reminder",
    "(preview, then confirm). Refusing to run.",
  ].join(" "),
);
process.exitCode = 1;
