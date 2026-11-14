import assert from "node:assert/strict";
import {
  extractArticleTocItems,
  splitMarkdownAfterKeyTakeaways,
} from "../lib/articles-shared";

function main() {
  const markdown = [
    "## Key takeaways",
    "",
    "- One",
    "",
    "## Load and posture",
    "",
    "Body copy.",
    "",
    "## Timing the swing",
    "",
    "More copy.",
    "",
    "## FAQ",
    "",
    "### What is this?",
    "An answer.",
  ].join("\n");

  const toc = extractArticleTocItems(markdown);
  assert.deepEqual(
    toc.map((item) => item.title),
    ["Load and posture", "Timing the swing"],
  );
  assert.equal(toc[0]?.id, "load-and-posture");
  assert.equal(toc[1]?.id, "timing-the-swing");

  const split = splitMarkdownAfterKeyTakeaways(markdown);
  assert.match(split.before, /## Key takeaways/);
  assert.match(split.before, /- One/);
  assert.doesNotMatch(split.before, /## Load and posture/);
  assert.match(split.after, /## Load and posture/);
  assert.match(split.after, /## FAQ/);

  const noTakeaways = splitMarkdownAfterKeyTakeaways("## Only section\n\nHi.");
  assert.equal(noTakeaways.before, "");
  assert.match(noTakeaways.after, /## Only section/);

  console.log("test-article-toc-shared: all passed");
}

main();
