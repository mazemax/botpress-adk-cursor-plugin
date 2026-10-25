# Compatibility evidence

## Tested real-host configurations

**None for `1.0.0-rc.1`.** No clean-host installation, discovery, activation, workflow, update, rollback, or uninstall result is claimed. Repository structure checks are not host compatibility evidence, and the Stage 3 compatibility gate remains open.

The machine-readable source is `tests/compatibility/matrix.json`. It currently contains three `expected-untested` Cursor IDE surface/OS rows, one `not-claimed` Cursor CLI row, and no `tested` rows.

## Support-state meanings

| State | Meaning |
|---|---|
| `tested` | Every lifecycle operation has observed evidence at the recorded host/version, OS/architecture, model, package SHA, and upstream revision. Failed or blocked operations remain visible; `tested` does not mean every operation passed. |
| `expected-untested` | Official documentation makes this a candidate surface, but this package has no observed result there. Every operation remains `untested`. |
| `not-claimed` | No support or parity is claimed. Cursor CLI remains in this state until separately packaged, reviewed, and tested evidence supports a scope change. |

A host, version, OS, or model must not be promoted to `tested` from documentation, a manifest parse, a successful structural test, or evidence from another surface.

## Candidate support matrix

| Host surface | Host version | OS targets | Current evidence |
|---|---|---|---|
| Cursor IDE | Unrecorded | Windows/macOS/Linux | `expected-untested`; host unavailable during implementation |
| Cursor CLI | Not applicable | Not applicable | `not-claimed`; IDE plugin documentation does not establish CLI parity |

Cursor IDE candidates are targets, not a support promise. The current stable IDE version must be tested before a production compatibility claim; earlier versions may be added only after actual testing.

## Lifecycle evidence required

Every matrix row separates `install`, `discovery`, `activation`, `workflow`, `update`, `rollback`, and `uninstall`. A `tested` row requires a status and existing sanitized evidence reference for every operation. No single smoke test may fill the whole row.

For every real run, record:

- Distribution `1.0.0-rc.1` and full immutable package commit SHA.
- Upstream `v2.0.7` and `79abe10503bf6dc70486737c94159322e108e496`.
- Exact host/version and surface, OS/version/architecture, model, timestamp, and repetitions.
- Install source/ref, expected and observed behavior, sanitized evidence, and limitations.

Use `tests/results/stage-3-result-template.json` for case-level records. Structural validation rejects placeholder metadata, unknown surfaces or case IDs, and tested rows without evidence. It does not judge whether an observed behavior is correct or make a failed row compatible.

## Current limitations

- Six skills and 12 generated commands are present, but real-host discovery, picker labels, `/adk-*` invocation, and activation are unverified.
- The copied-directory local-plugin flow is an official documented protocol, not an observed result for this package; Cursor CLI parity is not claimed.
- All 54 activation/routing cases, 12 command cases, three comparisons, and seven safety cases await real-host execution.
- No current-stable host matrix, golden path, update/rollback/uninstall result, or external Botpress developer beta has been completed.
- No Cursor Marketplace submission, listing, or approval has occurred.
- Actual ADK CLI prompts, generated files, network calls, and workspace effects remain live-verification items; see `docs/side-effects.md`.

## Known upstream reference issues

The pinned upstream contains two broken relative Markdown links. They are preserved verbatim and tracked in `tests/reference-exceptions.json`; any additional or stale exception fails `npm run check:references`.

- `skills/adk-frontend/references/authentication.md`: `../tables.md` does not resolve; the available guide is `skills/adk/references/tables.md`.
- `skills/adk-frontend/references/calling-actions.md`: `../actions.md` does not resolve; the available guide is `skills/adk/references/actions.md`.

These are documentation-link findings, not evidence that the related ADK workflows are broken. Report content concerns through the upstream-content issue template rather than silently patching managed files.

## Deterministic evidence

Maintainer commands and their observed outcomes are reported in dated files under `tests/results/` and in pull request checks. `npm run check:behavior` validates the inventory and evidence shape only. GitHub Actions results must be evaluated at the exact revision being released; no deterministic result fills a real-host gate.
