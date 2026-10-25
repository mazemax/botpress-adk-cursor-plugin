---
name: "adk-eval"
description: "Write, run, or debug evals for an ADK bot"
---
<!-- Generated from upstream/commands/adk-eval.md; run npm run generate:commands. Do not edit directly. -->
Load the `adk-evals` and `adk` skills, then help with evals immediately.

If `the command input` names a primitive or feature (e.g., "search", "checkout", "tickets"), check if evals already exist (`Glob({ pattern: "evals/**" })`). If found, ask: run them, debug them, or write a new one? If not found, search `src/` for related primitives, read the source code, and generate an eval tailored to that code with realistic assertions.

If `the command input` asks to run evals, run `adk evals` with appropriate flags.

If `the command input` mentions a failure ("failing", "broken", "wrong"), inspect the failing eval's traces and identify whether the issue is the eval's assertions or the bot's behavior.

If `the command input` is empty, check existing eval coverage (`Glob({ pattern: "evals/**" })`) and the user's primitives in `src/`, then suggest writing evals for untested primitives.

Follow the eval format, assertion types, and per-primitive testing patterns from the skill documentation.
