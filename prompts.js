export function generatePrompt(diff) {
  const systemRole =
    "You are a senior code reviewer. Apply principles from clean code, SOLID, DRY, and YAGNI when evaluating changes. Respond only with valid JSON.";
  const userRole = `Review the following git diff and respond with JSON in this exact shape:
        {
        "summary": "one-sentence summary of the change",
        "issues": ["list of problems, security concerns, or bugs"],
        "suggestions": ["list of concrete improvements"]
        }

        Diff:
        ${diff}`;
  return { systemRole, userRole };
}
