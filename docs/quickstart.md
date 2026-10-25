# Cursor quickstart

**Release candidate:** `1.0.0-rc.1`. This is a verification protocol based on current official host documentation, not a claim that the steps passed on your host. See `docs/compatibility.md`.

## Prerequisites

- A supported Cursor installation and account/configuration for that product.
- Git for a source install.
- For ADK workflows: the official Botpress ADK CLI, a compatible ADK environment, and a dedicated non-production Botpress workspace when a live dev bot is required.
- A disposable ADK project directory and synthetic data.
- Node.js 24+ only when running this repository's maintainer tooling; it is not a plugin runtime dependency.

Read `docs/side-effects.md` before invoking workflows. No Botpress token is needed for repository validation.

## Candidate local installation (Cursor)

Cursor's documented local-plugin flow uses real copied directories. The flow below has **not yet been run in this implementation environment**:

1. Copy the plugin to `~/.cursor/plugins/local/botpress-adk-community`, including `.cursor-plugin/plugin.json`, `skills/`, `assets/`, `LICENSE`, and `NOTICE.md`.
2. Do not use a symlink to a repository outside `~/.cursor/plugins/local`; Cursor documents that such symlinks are skipped.
3. Restart Cursor or run **Developer: Reload Window**.
4. Open **Customize** and inspect the expected skills.

This verifies local development loading only. Marketplace installation is unavailable until a separate review and approval; no listing is currently claimed.

## Five-minute discovery verification

1. Use a clean host profile and the intended package revision.
2. Restart/reload and start a fresh conversation.
3. Confirm the six skills are discoverable: `adk`, `adk-debugger`, `adk-dev-console`, `adk-docs`, `adk-evals`, and `adk-frontend`.
4. Check for duplicate personal/project/plugin skills with the same names.
5. Use a read-oriented prompt first: “Explain what a Botpress ADK action is and show one small example from the official ADK references.”
6. Record host/version, OS, model, package version, upstream SHA, expected result, and actual result in the host checklist.

Do not begin with `adk-ship`, credentials, a production workspace, or a destructive test.

## First disposable ADK workflow

After discovery succeeds, use `docs/workflows.md` and the manual checklist to inspect or initialize a disposable project, build one small primitive, validate it, and run a synthetic dev-only test. Review every proposed file and workspace mutation. Do not deploy.

## If verification fails

Use `docs/troubleshooting.md` and open the appropriate issue template with sanitized evidence. An installation or activation failure should be recorded as a release-blocking finding for the declared support matrix, not silently omitted.
