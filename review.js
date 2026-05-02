import "dotenv/config";

import { fetchPRDiff, postPRComment } from "./github-client.js";
import { askLLM } from "./llm-client.js";

const prUrl = process.argv[2];

if (!prUrl) {
  console.error("Usage: node review.js <PR_URL>");
  process.exit(1);
}

const diff = await fetchPRDiff(prUrl);

const systemRole =
  "You are a senior code reviewer. Respond only with valid JSON.";
const userRole = `Review the following git diff and respond with JSON in this exact shape:
{
  "summary": "one-sentence summary of the change",
  "issues": ["list of problems, security concerns, or bugs"],
  "suggestions": ["list of concrete improvements"]
}

Diff:
${diff}`;

const review = await askLLM(systemRole, userRole);



function formatReviewForComment(review) {
  let comment = `**PR Review**\n\n**Summary:** ${review.summary}\n\n`;
  if (review.issues.length > 0) {
    comment += "**Issues:**\n";
    review.issues.forEach((issue, index) => {
      comment += `${index + 1}. ${issue}\n`;
    });
    comment += "\n";
  }
  if (review.suggestions.length > 0) {
    comment += "**Suggestions:**\n";
    review.suggestions.forEach((suggestion, index) => {
      comment += `${index + 1}. ${suggestion}\n`;
    });
  }
  return comment;
}

const formattedComment = formatReviewForComment(review);

await postPRComment(prUrl, formattedComment);      
console.log('✓ Review posted');
