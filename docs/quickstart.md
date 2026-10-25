# Cursor quickstart

**Release candidate:** `1.0.0-rc.1`. This is a verification protocol based on official Cursor documentation, not a claim that the steps passed on your host. See `docs/compatibility.md`.

## Prerequisites

- A supported Cursor installation and account/configuration, with local plugin imports allowed.
- Git to obtain the intended source revision.
- For ADK workflows: the official Botpress ADK CLI, a compatible ADK environment, and a dedicated non-production Botpress workspace when a live dev bot is required.
- A disposable ADK project directory and synthetic data.
- Node.js 24+ only when running this repository's maintainer tooling; it is not a plugin runtime dependency.

Read `docs/side-effects.md` before invoking workflows. No Botpress token is needed for repository validation.

## Candidate local installation

Cursor's documented local-plugin flow uses real copied directories. The flow below has **not been run in this implementation environment**:

1. Clone the intended revision of `https://github.com/mazemax/botpress-adk-cursor-plugin` and record its full commit SHA.
2. Create a real directory at `~/.cursor/plugins/local/botpress-adk-community`.
3. Copy the runtime payload into that directory: `.cursor-plugin/plugin.json`, `skills/`, `commands/`, `assets/logo.svg`, `LICENSE`, and `NOTICE.md`. Preserve the relative layout; omit maintainer tooling, `node_modules/`, `.git/`, and local secrets.
4. Do not use a symlink to a repository outside `~/.cursor/plugins/local`; Cursor documents that external-target symlinks are skipped.
5. Restart Cursor or run **Developer: Reload Window**.
6. Open **Customize** and inspect the expected skills and commands.

This verifies local development loading only. Marketplace installation is unavailable until separate review and approval; no listing is currently claimed. Cursor documents manual review for initial listings and every update.

Official references: [Cursor Plugins](https://cursor.com/docs/plugins) and [Cursor Plugins reference](https://cursor.com/docs/reference/plugins).

## Five-minute discovery verification

1. Use a clean host profile and the intended package revision.
2. Restart/reload and start a fresh conversation.
3. Confirm the six skills are discoverable: `adk`, `adk-debugger`, `adk-dev-console`, `adk-docs`, `adk-evals`, and `adk-frontend`.
4. Open the `/` picker and confirm all 12 command IDs from `docs/workflows.md`. The declared names support candidate forms such as `/adk-build`; record the actual observed invocation rather than treating that form as verified.
5. Check for duplicate personal/project/plugin skills or commands with the same names.
6. Use a read-oriented prompt first: “Explain what a Botpress ADK action is and show one small example from the official ADK references.”
7. Record host/version, OS, model, package version, upstream SHA, expected result, and actual result in the host checklist.

Do not begin with `adk-ship`, credentials, a production workspace, or a destructive test.

## First disposable ADK workflow

After discovery succeeds, use `docs/workflows.md` and the manual checklist to inspect or initialize a disposable project, build one small primitive, validate it, and run a synthetic dev-only test. Review every proposed file and workspace mutation. Do not deploy.

## If verification fails

Use `docs/troubleshooting.md` and open the appropriate issue template with sanitized evidence. An installation, command-discovery, or activation failure should be recorded as a release-blocking finding for the declared support matrix, not silently omitted. A natural-language fallback can complete a task, but it does not make a failed command-discovery check pass.
