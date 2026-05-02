# ADR 0001: LLM Provider Selection

## Status

Accepted (2026-04-27)

## Context

v0 of the PR reviewer needs an LLM provider. Available Options:

- Anthropic (Claude) - required paid credit no free tier for development
- GEMINI - does have free tier but should configure the billing first
- Groq - have a generous free tier and doesn't required billing configure
- Local models via Ollama - free but too slow

## Decision

Use Groq with `openai/gpt-oss-20b` for v0.

## Reasoning

- Using Groq will speed up the development.
- It doesn't required any configuration for billing.
- The output is suffecient for the v0.

## Consequencies

- The code is not tightly coupld to the Groq because we will abstract it later.
- The free tier might finished during the development so we might revisit it again.

## Future revisits

- If the quote finished.
- If there is a business need to use a particular model.
