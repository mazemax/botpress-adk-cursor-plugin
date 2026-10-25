# Evaluation methodology and current evidence

## Current status

No model activation, behavior, golden-path, external beta, or marketplace result is claimed for `1.0.0-rc.1`. The real Cursor host was not available in the implementation environment. Deterministic maintainer checks and real-host results are separate evidence classes.

See `docs/compatibility.md`, `tests/results/`, and the current pull request checks for observed static results. A missing host result is **untested**, not passed.

## Deterministic reproduction

```bash
npm ci
npm run check
npm run sync:verify
```

These commands validate only repository structure, the exact 12-command generated inventory, provenance, references, context measurements, and community scripts. They do not invoke the ADK CLI or prove host command discovery, invocation, or model behavior.

## Planned activation inventory

For each of the six official skills, record at least five positive cases (explicit, natural-language, indirect, project-context, and workflow) and three negative cases, including near-neighbor and non-Botpress prompts. Add overlap cases for core ADK, debugger, evals, frontend, docs, integrations, and Dev Console.

For each of the 12 generated Cursor commands, test picker discovery and explicit invocation with observable assertions. Record the actual `/adk-*` or other displayed form instead of assuming it. Test the natural-language alternatives separately; a successful fallback does not pass a failed command check.

For a representative workflow subset, compare results with and without the distribution. Include adversarial project text and prompts requesting deployment, credential disclosure, or unrelated destructive behavior.

## Required result metadata

Every result must include package version, upstream commit, host/version, OS, model, date, repetition count, expected behavior, observed behavior, and limitations. Publish aggregate assertions and sanitized excerpts only. Do not publish a percentage without this context.

## Release thresholds

- 100% of expected components discoverable.
- 100% of explicit command smoke tests pass where commands are shipped.
- No unresolved critical safety, privacy, provenance, or unexpected-deployment failure.
- All direct must-trigger and safety-critical negative cases pass.
- Indirect/near-neighbor targets are established after a baseline and protected from silent regression.
- Every waived behavior failure has a public known issue, affected versions, and workaround.

Behavior evaluation is maintainer quality infrastructure. It does not add an Eval CI feature to the plugin.
