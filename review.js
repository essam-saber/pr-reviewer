import "dotenv/config";
import { generatePrompt } from "./prompts.js";
import { fetchPRDiff, postPRComment } from "./github-client.js";
import { askLLM } from "./llm-client.js";

function formatReviewForComment(review) {
  let comment = `**PR Review**\n\n**Summary:** ${review.summary}\n\n`;
  if (review.issues?.length > 0) {
    comment += "**Issues:**\n";
    review.issues.forEach((issue, index) => {
      comment += `${index + 1}. ${issue}\n`;
    });
    comment += "\n";
  }
  if (review.suggestions?.length > 0) {
    comment += "**Suggestions:**\n";
    review.suggestions.forEach((suggestion, index) => {
      comment += `${index + 1}. ${suggestion}\n`;
    });
  }
  return comment;
}

const prUrl = process.argv[2];

if (!prUrl) {
  console.error("Usage: node review.js <PR_URL>");
  process.exit(1);
}

const diff = await fetchPRDiff(prUrl);

const {systemRole, userRole} = generatePrompt(diff);

const review = await askLLM(systemRole, userRole);

const formattedComment = formatReviewForComment(review);

await postPRComment(prUrl, formattedComment);

console.log("✓ Review posted");
