# Stage 3 local structural validation — 2026-10-25

## Scope and evidence boundary

This is deterministic maintainer evidence for `1.0.0-rc.1`, not a real-host behavior or compatibility result. It covers the Stage 3 working branch based on Stage 2 merge `4772f0a880985f68d2b97cf958e80cb6591de4d6`. The exact Stage 3 commit and CI result are identified on the pull request; this file does not claim an immutable release SHA.

No model, Cursor host, ADK workflow, deployment, external mutation, production workspace, real PAT, or customer data was used. The `copilot`, `codex`, `cursor`, `code`, and `gh` commands were unavailable when checked at `2026-10-25T15:30:14+08:00`; live host execution therefore remained blocked.

## Environment

| Field | Observed value |
|---|---|
| Validation date | 2026-10-25, local time UTC+08:00 |
| OS reported by Node | `win32`, release `10.0.26200` |
| Architecture | `x64` |
| Node.js | `24.21.0` |
| npm | `11.12.1` |
| Git | `2.47.1.windows.1` |
| Distribution | `1.0.0-rc.1` |
| Upstream | `botpress/skills` `v2.0.7` |
| Upstream commit | `79abe10503bf6dc70486737c94159322e108e496` |
| Model | Not applicable; no model was run |
| Live result files | 0 `*.result.json` files |

## Observed deterministic outcomes

The following commands passed locally before this evidence file was added and were rerun with it present:

| Command | Observed outcome |
|---|---|
| `npm ci` | 48 packages added, 49 audited, 0 vulnerabilities |
| `npm run check` | Complete deterministic pipeline passed: typecheck, command drift, repository validation, references, context baseline, behavior inventory, and unit tests |
| `npm run check:behavior` | 54 activation cases: 30 positive, 18 negative, 6 overlap; 22 workflow cases: 12 command, 3 comparison, 7 safety; 4 compatibility surfaces; 0 live result files |
| `npm run check:commands` | Exactly 12 generated commands verified under `commands/` |
| `npm run validate` | 6 skills, 12 upstream commands, 78 provenance-tracked files verified |
| `npm run check:references` | 117 Markdown files, 222 local links, 17 skill-reference mentions, and exactly 2 documented upstream exceptions checked |
| `npm run measure:context` | Baseline passed: 264 estimated discovery tokens, 56 reference files, 893069 skill-package bytes |
| `npm test` | 6 test files and 19 tests passed, including 5 new behavior-validator tests |
| `npm run sync:verify` | All 78 files matched the immutable upstream commit |
| `npm run sync:check -- --json` | Current and latest commits were both `79abe10503bf6dc70486737c94159322e108e496`; `updateAvailable: false` |
| `npm audit` | 0 vulnerabilities |

## Inventory and safety assertions checked structurally

- Every official skill has five required positive categories and three negative categories, including near-neighbor and non-Botpress controls.
- Six overlap focuses cover debugger, evals, frontend, docs, integrations, and Dev Console routing.
- Every generated command has separate discovery and invocation assertions and existing generated/upstream reference paths.
- Three comparisons require fresh with/without-plugin conversations and controlled host, model, project, prompt, and repetition conditions.
- Seven critical safety categories cover adversarial project text, deployment consent, credential disclosure, destructive behavior, shared/production data, integration mutation, and frontend PAT exposure.
- `adk-ship` and deployment-consent cases are preflight-only and explicitly forbid `adk deploy` and production deployment.
- Three Cursor IDE surface/OS rows remain `expected-untested`; Cursor CLI remains `not-claimed`. No lifecycle operation has evidence.

These are properties of the test definitions, not observed model behavior.

## Open live gates and limitations

- No real-host install, discovery, activation, explicit invocation, golden path, comparison, safety, update, rollback, or uninstall case was executed.
- No indirect/near-neighbor baseline or activation percentage was produced.
- No current-stable host/version or model compatibility claim is made; Cursor IDE evidence cannot be transferred to Cursor CLI.
- Critical live safety behavior is unassessed; structural checks cannot establish that there are no unresolved critical failures.
- No external beta, marketplace submission, tag, branch-protection verification, or production-readiness claim is included.

**Stage 3 exit criterion: not met.** Publish sanitized real-host `.result.json` evidence with exact environment metadata and resolve any critical failures before marking Stage 3 complete. CI evidence is evaluated separately on the exact Stage 3 PR head.
