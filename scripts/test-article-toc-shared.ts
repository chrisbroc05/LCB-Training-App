import assert from "node:assert/strict";
import {
  extractArticleTocItems,
  extractKeyTakeawayItems,
  normalizeArticleMarkdown,
  prepareArticleMarkdown,
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

  const flat = [
    "Key takeaways",
    "Private lesson prices vary a lot.",
    "Lessons are worth it when they add reps.",
    "",
    "Private baseball lessons are worth the money when the coach fits.",
    "",
    "How much do private baseball lessons cost?",
    "",
    "Prices depend on your area.",
    "",
    "What drives the price",
    "Coach experience. Playing level and years of coaching.",
    "Facility costs. Cage and turf rental get built into the price.",
    "",
    "In-person vs. remote",
    "",
    "Remote video feedback usually costs less.",
    "",
    "Continue, switch, or stop",
    "Continue if the video shows change.",
    "Switch if nothing is changing.",
    "FAQ",
    "How much do private baseball lessons cost?",
    "",
    "It depends on your area and the coach.",
    "",
    "What age should a kid start private baseball lessons?",
    "",
    "There's no perfect age.",
  ].join("\n");

  const normalized = normalizeArticleMarkdown(flat);
  assert.match(normalized, /^## Key takeaways/m);
  assert.match(normalized, /^- Private lesson prices vary a lot\./m);
  assert.match(normalized, /^## How much do private baseball lessons cost\?/m);
  assert.match(normalized, /^## What drives the price/m);
  assert.match(normalized, /\*\*Coach experience\.\*\*/);
  assert.match(normalized, /^## In-person vs\. remote/m);
  assert.match(normalized, /^## FAQ/m);
  assert.match(normalized, /^### How much do private baseball lessons cost\?/m);
  assert.match(normalized, /^### What age should a kid start private baseball lessons\?/m);
  assert.equal(normalizeArticleMarkdown(markdown), markdown);

  const prepared = prepareArticleMarkdown(flat);
  assert.deepEqual(prepared.takeaways, [
    "Private lesson prices vary a lot.",
    "Lessons are worth it when they add reps.",
  ]);
  assert.deepEqual(extractKeyTakeawayItems(prepared.content), prepared.takeaways);
  assert.ok(prepared.tocItems.length >= 3);
  assert.ok(prepared.tocItems.every((item) => !/faq|takeaway/i.test(item.title)));
  assert.equal(prepared.faqItems.length, 2);
  assert.equal(prepared.faqItems[0]?.question, "How much do private baseball lessons cost?");
  assert.match(prepared.bodyMarkdown, /Private baseball lessons are worth the money/);
  assert.match(prepared.bodyMarkdown, /Prices depend on your area\./);
  assert.doesNotMatch(prepared.bodyMarkdown, /^- Prices depend on your area\./m);
  assert.doesNotMatch(prepared.bodyMarkdown, /^## FAQ/m);
  assert.doesNotMatch(prepared.bodyMarkdown, /Key takeaways/);

  console.log("test-article-toc-shared: all passed");
}

main();
