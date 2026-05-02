import "dotenv/config";

import { fetchPRDiff } from "./github-client.js";
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
console.log(review);
