import assert from "node:assert/strict";
import {
  buildArticleLeadSource,
  formatLeadSourceLabel,
  isArticleLeadSource,
  parseArticleLeadSource,
} from "../lib/articles-lead-shared";

function main() {
  assert.equal(buildArticleLeadSource("baseball-private-lessons-cost-value"), "Article: baseball-private-lessons-cost-value");
  assert.equal(
    parseArticleLeadSource("Article: baseball-private-lessons-cost-value"),
    "baseball-private-lessons-cost-value",
  );
  assert.equal(parseArticleLeadSource("resources"), null);
  assert.equal(isArticleLeadSource("Article: foo"), true);
  assert.equal(isArticleLeadSource("quiz"), false);
  assert.equal(formatLeadSourceLabel("quiz"), "Quiz");
  assert.equal(
    formatLeadSourceLabel("Article: baseball-private-lessons-cost-value"),
    "Article: baseball-private-lessons-cost-value",
  );

  console.log("test-articles-lead-shared: all passed");
}

main();
