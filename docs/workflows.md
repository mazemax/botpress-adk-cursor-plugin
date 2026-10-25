# Workflow guide

The package includes the official skills; choose a task rather than loading the entire reference tree. Stage 1 does not claim real-host activation evidence.

| Task | Official skill | Upstream command source | Example request |
|---|---|---|---|
| Understand ADK or build a primitive | `adk` | `adk-build` | “Read my ADK project and propose an action that looks up an order. Show the files before editing.” |
| Create a project | `adk` | `adk-init` | “In this disposable directory, guide me through initializing a Botpress ADK hello-world project.” |
| Validate wiring | `adk` | `adk-validate` | “Validate the checkout feature and its related primitives; do not apply fixes.” |
| Invoke one primitive | `adk` | `adk-test` | “Test the lookupOrder action with synthetic input and report whether the trace actually exercised it.” |
| Debug a failure | `adk-debugger`, `adk` | `adk-debug` | “Investigate this sanitized ADK error using check, logs, and traces before proposing a fix.” |
| Write or run official ADK evals | `adk-evals`, `adk` | `adk-eval` | “Write a regression eval for the order-lookup behavior using synthetic data.” |
| Add an integration | `adk` | `adk-integration` | “Search for Slack integrations, show pinned versions, and stop before making any workspace change.” |
| Build a frontend | `adk-frontend`, `adk` | `adk-frontend` | “Add a typed service for calling my bot's order action without exposing the PAT.” |
| Document a bot | `adk-docs`, `adk` | `adk-document` | “Review docs/workflows.md against my actual primitives and report inaccuracies.” |
| Explain architecture | `adk` | `adk-explain` | “Explain this bot's channels, tools, tables, and models from its actual configuration.” |
| Navigate Dev Console | `adk-dev-console` | `adk-dev-console` | “Where do I inspect traces, and what does an Agent Steps iteration mean?” |
| Deploy to production | `adk` | `adk-ship` | Not offered as a smoke test. Requires a deliberate user workflow and separate explicit deployment confirmation. |

## Safe first golden path

1. Use a disposable project and a dedicated non-production workspace.
2. Read `docs/side-effects.md` and verify the intended ADK CLI/workspace.
3. Initialize or inspect the project with the official skill.
4. Build a small primitive after reviewing proposed files.
5. Run static validation, then a synthetic one-shot test only in the dev environment.
6. Record expected/observed results and the host, model, package, and upstream versions.
7. Do not deploy. Production shipping is outside unattended smoke testing.

Stage 1 has not completed this golden path in a real Cursor host. The steps are the verification protocol, not a compatibility claim.
