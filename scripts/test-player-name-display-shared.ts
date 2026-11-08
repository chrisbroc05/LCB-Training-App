import { formatPlayerDisplayName } from "../lib/player-name-display-shared";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

assert(formatPlayerDisplayName("AJ fong") === "AJ Fong", "AJ fong");
assert(formatPlayerDisplayName("aj fong") === "Aj Fong", "all lowercase");
assert(formatPlayerDisplayName("McElroy") === "McElroy", "McElroy kept");
assert(formatPlayerDisplayName("O'Malley") === "O'Malley", "O'Malley kept");
assert(formatPlayerDisplayName("  sean   kersey ") === "Sean Kersey", "trim and spaces");

console.log("test-player-name-display-shared: ok");
