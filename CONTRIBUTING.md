# Contributing

Thank you for improving this community distribution. Contributions should make the Cursor developer workflow more reliable, clearer, or easier to verify—not add new ADK feature categories.

## Set up maintainer tooling

Use Node.js 24 or newer:

```bash
npm ci
npm run check
npm run sync:verify
```

`sync:verify` performs a read-only fetch of the exact commit in `UPSTREAM.json`. It does not execute upstream scripts or require Botpress credentials.

## Contribution boundaries

- Keep `skills/` and `upstream/` byte-for-byte aligned with the recorded upstream snapshot.
- Propose ADK content changes in [botpress/skills](https://github.com/botpress/skills), then bring them here through a reviewed sync.
- Keep packaging specific to Cursor. Do not add MCP, agents, hooks, doctor, an Eval CI product, telemetry, or replacement ADK knowledge.
- Do not run production deployment, mutate a real user workspace, or include secrets/private project content in tests.
- Update documentation and tests with every packaging change.
- Mark unrun host and model checks as untested.

## Upstream syncs

Use `npm run sync:check` to inspect the public upstream branch. The scheduled workflow can prepare a candidate branch and pull request, but it never auto-merges. Review the complete diff, side-effect changes, reference results, and context baseline before approving a sync.

## Tests

- `npm run generate:commands` — regenerate the 12 Cursor commands after a reviewed upstream command change; never edit generated files directly.
- `npm run check:commands` — reject missing, extra, manually edited, or unsupported generated command content.
- `npm run validate` — manifest, generated-command, inventory, attribution, component-boundary, workflow-pin, and recorded-hash checks.
- `npm run check:references` — local Markdown and skill-reference reachability.
- `npm run measure:context` — compare the reviewed context baseline.
- `npm run check:behavior` — validate Stage 3 coverage, references, command cases, safety boundaries, compatibility states, and result metadata without invoking a model or host.
- `npm test` — maintainer-tooling unit tests; no live Botpress workspace is used.
- `npm run sync:verify` — compare local bytes with the immutable public upstream commit.

Behavior evaluations are maintainer quality work, not a user-facing Eval CI product. See `docs/evaluation.md` and `tests/host-checklists/` before submitting host evidence.

## Behavior case and result contributions

- Preserve unique case IDs, fresh-conversation isolation, expected/forbidden skills, observable assertions, and existing repository-relative references.
- Keep all five positive and three negative categories for every official skill; preserve command, comparison, and critical-safety coverage when editing related cases.
- Do not weaken deployment prohibitions, claim Cursor CLI parity without evidence, or convert `adk-ship` into an executable smoke test. Tests must remain synthetic, disposable, non-production, and credential-free.
- Use `tests/results/stage-3-result-template.json` only for real observed runs. An absent result is untested; never fill expected observations or compatibility evidence from documentation.
- Include exact package/upstream revisions, host/version/surface, OS/architecture, model, timestamp, repetitions, observed outcomes, sanitized evidence, and limitations. Do not include private transcripts, customer data, or secrets.

## Security and support

Do not disclose vulnerabilities or credentials in a public issue. Follow `SECURITY.md`. For installation, activation, packaging, and upstream-content reports, use the appropriate issue template and include the requested environment metadata.
