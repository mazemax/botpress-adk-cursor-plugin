# Stage 2 validation evidence — 25 October 2026

## Environment and scope

Repository: `mazemax/botpress-adk-cursor-plugin`. Maintainer tooling ran on Windows in Git Bash with Node.js `24.21.0`, npm `11.12.1`, and Git `2.47.1.windows.1`. The environment timestamp was `2026-10-25T14:42:16+08:00`. These are repository/tooling results, not real-host compatibility results.

Verification sequence:

```bash
npm ci
npm run check
npm run check:commands
npm run sync:verify
npm run sync:check -- --json
npm audit
```

## Observed outcomes

| Check | Result |
|---|---|
| Clean dependency installation | Passed with `npm ci` |
| Dependency audit | `npm audit` reported 0 vulnerabilities |
| TypeScript type checking | Passed |
| Generated command drift | Passed twice: 12 commands in `commands/`; no missing, extra, or modified files |
| Manifest, component, inventory, and provenance validation | Passed: 6 skills, 12 upstream commands, 78 provenance-tracked files |
| Local reference integrity | Passed with this evidence file present: 116 Markdown files, 222 local links, 17 skill-reference mentions, 2 documented upstream exceptions |
| Context baseline | Passed: 264 estimated discovery tokens, 56 reference files, 893069 skill-package bytes; token count is a rough estimate, not provider tokenization |
| Unit tests | Passed: 5 test files, 14 tests |
| Pinned upstream verification | Passed: all 78 files match `79abe10503bf6dc70486737c94159322e108e496` |
| Upstream update check | `updateAvailable: false` when observed on 25 October 2026; current and latest commits were identical |

The two reference exceptions preserve genuine broken relative links in upstream `v2.0.7`: `skills/adk-frontend/references/authentication.md` targets `../tables.md`, and `skills/adk-frontend/references/calling-actions.md` targets `../actions.md`. They are documented in `docs/compatibility.md` and pinned in `tests/reference-exceptions.json`; new or stale exceptions fail the check.

## Not tested or performed

The `cursor` executable was unavailable when checked. No Cursor IDE/CLI installation, six-skill discovery, 12-command discovery or invocation, model activation, golden path, update, rollback, duplicate-install, or uninstall test was run. The candidate `/adk-*` invocation forms are not recorded as verified.

No ADK CLI workflow or live Botpress workspace was invoked. No external beta, production deployment, Cursor Marketplace submission, listing, or approval occurred. GitHub Actions and branch protection must be evaluated at the exact pushed revision; this local evidence does not record them as passed.
