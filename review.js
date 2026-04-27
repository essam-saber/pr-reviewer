import 'dotenv/config';
import Groq from 'groq-sdk';

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY, // This is the default and can be omitted
});

const diff = `
diff --git a/src/auth.js b/src/auth.js
@@ -10,7 +10,12 @@ function login(username, password) {
-  const user = db.query("SELECT * FROM users WHERE name = '" + username + "'");
+  const user = db.query("SELECT * FROM users WHERE name = ?", [username]);
   if (user && user.password === password) {
     return generateToken(user);
   }
+  return null;
 }
`;


const systemPrompt = 'You are a senior code reviewer. Respond only with valid JSON.';
const userPrompt = `Review the following git diff and respond with JSON in this exact shape:
{
  "summary": "one-sentence summary of the change",
  "issues": ["list of problems, security concerns, or bugs"],
  "suggestions": ["list of concrete improvements"]
}

Diff:
${diff}`;

const completion = await client.chat.completions.create({
  model: 'openai/gpt-oss-20b',
  messages: [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ],
  response_format: { type: 'json_object' },
});

const review = JSON.parse(completion.choices[0].message.content);
console.log(review);