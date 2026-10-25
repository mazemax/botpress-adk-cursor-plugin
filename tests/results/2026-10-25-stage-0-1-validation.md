# Stage 0–1 validation evidence — 25 October 2026

## Environment and scope

Repository: `mazemax/botpress-adk-cursor-plugin`. Maintainer tooling ran on Windows in Git Bash with Node.js `24.21.0`, npm `11.12.1`, and Git `2.47.1.windows.1`. These are repository/tooling results, not real-host compatibility results.

The final sequence completed successfully in this repository:

```bash
npm install
npm run measure:context -- --write
npm ci
npm run check
npm run sync:verify
npm run sync:check -- --json
```

## Observed outcomes

| Check | Result |
|---|---|
| Dependency installation and clean `npm ci` | Passed; npm reported 0 vulnerabilities |
| TypeScript type checking | Passed |
| Manifest, inventory, and provenance validation | Passed: 6 skills, 12 upstream commands, 78 provenance-tracked files |
| Local reference integrity | Passed: 103 Markdown files, 222 local links, 17 skill-reference mentions, 2 documented upstream exceptions |
| Context baseline | Passed: 264 estimated discovery tokens, 56 reference files, 893069 skill-package bytes; token count is a rough estimate, not provider tokenization |
| Unit tests | Passed: 4 test files, 10 tests |
| Pinned upstream verification | Passed: all 78 files match `79abe10503bf6dc70486737c94159322e108e496` |
| Upstream update check | `updateAvailable: false` when observed on 25 October 2026 |

The two exceptions preserve genuine broken relative links in upstream `v2.0.7`: `skills/adk-frontend/references/authentication.md` targets `../tables.md`, and `skills/adk-frontend/references/calling-actions.md` targets `../actions.md`. They are documented in `docs/compatibility.md` and pinned in `tests/reference-exceptions.json`; new or stale exceptions fail the check.

## Not tested or performed

No Cursor IDE/CLI installation, skill discovery or activation, model behavior, update, rollback, or uninstall test was run. No ADK CLI workflow or live Botpress workspace was invoked. No external beta, production deployment, marketplace submission, or approval occurred. GitHub Actions must be evaluated at the exact pushed revision before release.
