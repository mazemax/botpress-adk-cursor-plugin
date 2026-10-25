# Workflow guide

The package includes six official skills and 12 generated Cursor commands. Choose one focused task rather than loading the entire reference tree. The commands are mechanical adaptations of `upstream/commands/`; they add no new ADK capability and have not passed real-host activation testing.

## Invoke a command

1. Install the intended revision as a real local directory, restart Cursor or run **Developer: Reload Window**, and start a fresh session.
2. Open the `/` command picker and select the desired `adk-*` entry. Cursor command frontmatter declares names such as `adk-build`, so the documented candidate form is `/adk-build [input]`; the actual invocation remains subject to real-host verification.
3. Provide the input described by the command's argument hint. Review proposed writes, commands, credentials, and target workspaces before approving them.
4. If a command is absent, record a discovery failure. You can use the natural-language alternative for the task, but that does not make the command-discovery test pass.

The prompt examples below are copyable natural-language alternatives, not claims of equivalent model behavior.

## Command reference

### `adk-init`

- **Purpose and skill:** Scaffold and optionally link a new ADK project using `adk`.
- **Prerequisites:** Official ADK CLI, a disposable parent directory, appropriate Botpress authentication, and an intentional workspace/bot target for linking.
- **Effects:** Writes project files; runs login/init/link/check; authentication and linking can affect external configuration. No production deployment is part of initialization.
- **Natural language:** “In this disposable directory, guide me through initializing a Botpress ADK hello-world project. Confirm the workspace before linking and do not deploy.”

### `adk-build`

- **Purpose and skill:** Interview briefly, plan, and build an ADK primitive or feature using `adk`.
- **Prerequisites:** An ADK project and a clear outcome; review the existing handlers and `agent.config.ts` before planning.
- **Effects:** Creates or modifies source/config files and always runs `adk check`; adding dependencies is a separate mutation. Non-trivial plans and config edits require approval under the upstream workflow.
- **Natural language:** “Read my ADK project and propose an action that looks up an order. List the files and dependencies before editing, then run static validation.”

### `adk-validate`

- **Purpose and skill:** Check a primitive or feature and its wiring using `adk`, without applying fixes.
- **Prerequisites:** An existing ADK project and a target name; no live invocation is required for static validation.
- **Effects:** Runs type/check and integration list/status commands and reads project files. It is intended not to modify files; linked workspace status may be read.
- **Natural language:** “Validate the checkout feature and its related primitives. Report errors, warnings, and wiring findings; do not invoke the feature or apply fixes.”

### `adk-test`

- **Purpose and skill:** Invoke one primitive end-to-end with realistic input using `adk`.
- **Prerequisites:** A linked non-production dev bot, synthetic input, and a cleanup plan. Ask before table inserts in any shared or production workspace.
- **Effects:** Can create/delete `.adk/scratch` runners, invoke live dev behavior, read traces, mutate dev tables/workflows/state, and call integrations.
- **Natural language:** “Test the lookupOrder action with synthetic input in the dev environment. Verify from the trace that it ran and clean up every disposable runner or test row.”

### `adk-debug`

- **Purpose and skills:** Diagnose a failure from checks, logs, traces, and reproduction using `adk-debugger` and `adk`.
- **Prerequisites:** Sanitized error context, a disposable project, and a non-production dev bot for reproduction.
- **Effects:** Reads runtime evidence; can reproduce live dev behavior, implement a targeted fix, and write/run a regression eval under `evals/`.
- **Natural language:** “Investigate this sanitized ADK error using check, logs, and traces. Explain the root cause and proposed regression coverage before changing files; do not use production.”

### `adk-eval`

- **Purpose and skills:** Write, run, or debug official ADK evals using `adk-evals` and `adk`.
- **Prerequisites:** A behavior to assert, synthetic data, and a linked non-production dev bot when running evals.
- **Effects:** Can create/update eval files and run live dev events, tools, workflows, and integrations that mutate dev state. This is not a new Eval CI product.
- **Natural language:** “Write a regression eval for the order-lookup behavior using synthetic data. Show the assertions before writing and run it only against the dev bot.”

### `adk-integration`

- **Purpose and skill:** Discover, inspect, add, configure, remove, or upgrade Botpress integrations and plugins using `adk`.
- **Prerequisites:** An ADK project, intentional integration/plugin name, and pinned version for installation; confirm the dev/prod target.
- **Effects:** Reads remote package/state information and can change generated dependencies or external dev/prod configuration. Add/remove always requires confirmation; review every other mutation separately.
- **Natural language:** “Search for Slack integrations, show the available pinned versions and current status, and stop before making any project or workspace change.”

### `adk-frontend`

- **Purpose and skills:** Build or explain a typed frontend that integrates with an ADK bot using `adk-frontend` and `adk`.
- **Prerequisites:** An existing frontend or an approved scaffold destination; use credentials only through the documented secure pattern.
- **Effects:** Reads/writes frontend files, can install dependencies and run type/dev/build commands, and may use Botpress APIs. A frontend request is not permission to deploy.
- **Natural language:** “Add a typed service for calling my bot's order action. Review the files before editing, keep the PAT out of client code and logs, and do not deploy the bot.”

### `adk-document`

- **Purpose and skills:** Create, review, update, sync, or search project documentation using `adk-docs` and `adk`.
- **Prerequisites:** An ADK project or documentation target; confirm the destination before create/update operations.
- **Effects:** Review/sync/search are read-oriented; create/update writes documentation and reads actual project source. No cloud mutation is inherent in the command.
- **Natural language:** “Review docs/workflows.md against my actual ADK primitives. Report inaccurate code, imports, paths, and unsupported claims without editing the file.”

### `adk-explain`

- **Purpose and skill:** Explain an ADK concept or the actual bot architecture using `adk`.
- **Prerequisites:** A question and, for project-specific explanations, an ADK project whose configuration is safe to inspect.
- **Effects:** Reads source/config and can run `adk status`; no intentional writes. Review output for secrets before sharing it.
- **Natural language:** “Explain this bot's channels, tools, tables, and models from its actual configuration. Do not change files or include credentials in the answer.”

### `adk-dev-console`

- **Purpose and skill:** Explain Dev Console pages, traces, Agent Steps, and UI concepts using `adk-dev-console`.
- **Prerequisites:** Only a conceptual question for read-oriented use; live console access is not required to explain a feature.
- **Effects:** The command is explanatory. Console pages can expose sensitive dev/prod data, and UI actions can mutate state; do not run lifecycle commands merely to answer a question.
- **Natural language:** “Where do I inspect traces, and what does an Agent Steps iteration mean? Explain the UI without changing console data or running lifecycle commands.”

### `adk-ship`

- **Purpose and skill:** Run pre-flight checks and deploy an ADK bot to production using `adk`.
- **Prerequisites:** Deliberate production intent, reviewed working tree, correct bot/workspace, required secrets/dependencies, and a separate deployment decision. This is never a smoke test.
- **Effects:** Pre-flight reads status and can run evals; an approved compatibility upgrade can patch files. Deployment mutates production and may sync assets/dependencies. The original invocation is not deployment consent.
- **Natural language:** “Run the official ADK production pre-flight checks for this bot and summarize blockers. Stop before deployment; any later `adk deploy` requires my separate explicit confirmation immediately beforehand.”

## Safe first golden path

1. Use a disposable project and a dedicated non-production workspace.
2. Read `docs/side-effects.md` and verify the intended ADK CLI/workspace.
3. Select `adk-init` or inspect the project, then use `adk-build` for one small primitive after reviewing proposed files.
4. Run `adk-validate`, then a synthetic dev-only `adk-test` only after confirming the target and cleanup plan.
5. Record expected/observed results and the host, model, package, and upstream versions.
6. Do not deploy. Production shipping is outside unattended smoke testing.

Stage 2 has not completed this golden path in a real Cursor host. The steps are the verification protocol, not a compatibility claim.
