import { generatePrompt } from "./prompts.js";
import { askLLM } from "./llm-client.js";

const testCase = {
  name: "detects SQL injection vulnerability",
  diff: `diff --git a/src/users.js b/src/users.js
index 1234567..abcdefg 100644
--- a/src/users.js
+++ b/src/users.js
@@ -15,8 +15,12 @@ async function getUserByEmail(email) {
-  const result = await db.query("SELECT * FROM users WHERE email = '" + email + "'");
-  return result.rows[0];
+  const result = await db.query("SELECT * FROM users WHERE email = '" + email + "' AND active = 1");
+  if (result.rows.length === 0) {
+    return null;
+  }
+  return result.rows[0];
 }`,
  mustContains: [
    "SQL injection",
    "user input",
    "prepared statements",
    "parameterized",
    "sanitiz",
  ],
};

const { systemRole, userRole } = generatePrompt(testCase.diff);

const review = await askLLM(systemRole, userRole);

const reviewText = JSON.stringify(review).toLowerCase();

const passed = testCase.mustContains.some((keyword) =>
  reviewText.includes(keyword.toLowerCase()),
);
console.log("Generated review:", review);
console.log(passed ? `✓ ${testCase.name}` : `✗ ${testCase.name}`);
