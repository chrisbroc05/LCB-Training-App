import assert from "node:assert/strict";
import {
  parseCoachText,
  parseCoachTextInlines,
} from "../lib/coach-text-format-shared";

assert.deepEqual(parseCoachTextInlines("Hello **world** today"), [
  { type: "text", value: "Hello " },
  { type: "bold", value: "world" },
  { type: "text", value: " today" },
]);

assert.deepEqual(parseCoachText(""), []);
assert.deepEqual(parseCoachText("   \n  "), []);

const paragraphs = parseCoachText("Line one\nLine two\n\nNext paragraph");
assert.equal(paragraphs.length, 2);
assert.equal(paragraphs[0]?.type, "paragraph");
assert.equal(paragraphs[1]?.type, "paragraph");
if (paragraphs[0]?.type === "paragraph") {
  assert.equal(paragraphs[0].lines.length, 2);
}

const bullets = parseCoachText("Intro\n\n- First\n- Second\n\nOutro");
assert.equal(bullets.length, 3);
assert.equal(bullets[1]?.type, "ul");
if (bullets[1]?.type === "ul") {
  assert.equal(bullets[1].items.length, 2);
  assert.deepEqual(bullets[1].items[0], [{ type: "text", value: "First" }]);
}

const numbered = parseCoachText("1. Alpha\n2. **Beta**");
assert.equal(numbered.length, 1);
assert.equal(numbered[0]?.type, "ol");
if (numbered[0]?.type === "ol") {
  assert.deepEqual(numbered[0].items[1], [{ type: "bold", value: "Beta" }]);
}

const mixedBullets = parseCoachText("* Star\n- Dash");
assert.equal(mixedBullets[0]?.type, "ul");

const withLink = parseCoachTextInlines("See https://example.com/path for more");
assert.deepEqual(withLink, [
  { type: "text", value: "See " },
  { type: "link", href: "https://example.com/path", value: "https://example.com/path" },
  { type: "text", value: " for more" },
]);

const javascriptIgnored = parseCoachTextInlines("Bad javascript:alert(1)");
assert.deepEqual(javascriptIgnored, [{ type: "text", value: "Bad javascript:alert(1)" }]);

console.log("test-coach-text-format-shared: ok");
