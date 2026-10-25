# Compatibility evidence

## Tested real-host configurations

**None yet for `1.0.0-rc.1`.** No clean-host installation, activation, workflow, update, rollback, or uninstall result is claimed. Repository structure checks are not host compatibility evidence.

## Candidate support matrix

| Host surface | Host version | OS target | Current evidence |
|---|---|---|---|
| Cursor IDE | Version not recorded | Windows/macOS/Linux | Expected from official Cursor Plugin documentation; **untested** — host unavailable during implementation |
| Cursor CLI | Version not recorded | Windows/macOS/Linux | **Not claimed**; plugin-surface parity requires separate evidence |

“Expected” means the official format documentation describes the surface; it does not mean this package passed there. Add a version to the tested matrix only after recording actual evidence.

## Evidence to record

For every tested row, capture host/version, OS/architecture, distribution `1.0.0-rc.1`, upstream `v2.0.7` / `79abe10503bf6dc70486737c94159322e108e496`, model, date, install source/SHA, and separate results for install, discovery, activation, golden path, update, rollback, and uninstall.

## Current limitations

- Six skills are present, but real-host discovery and activation are unverified.
- Stage 1 does not ship converted host commands; the source command inventory is retained under `upstream/commands/`.
- No external Botpress developer beta has been completed.
- No marketplace submission or approval has occurred.
- Actual ADK CLI prompts, generated files, network calls, and workspace effects remain live-verification items; see `docs/side-effects.md`.

## Known upstream reference issues

The pinned upstream contains two broken relative Markdown links. They are preserved verbatim and tracked in `tests/reference-exceptions.json`; any additional or stale exception fails `npm run check:references`.

- `skills/adk-frontend/references/authentication.md`: `../tables.md` does not resolve; the available guide is `skills/adk/references/tables.md`.
- `skills/adk-frontend/references/calling-actions.md`: `../actions.md` does not resolve; the available guide is `skills/adk/references/actions.md`.

These are documentation-link findings, not evidence that the related ADK workflows are broken. Report content concerns through the upstream-content issue template rather than silently patching managed files.

## Deterministic evidence

Maintainer commands and their observed outcomes are reported in the implementation pull request and dated files under `tests/results/`. GitHub Actions results must be evaluated at the exact revision being released.
