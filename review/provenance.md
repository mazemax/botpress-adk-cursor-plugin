# Upstream provenance review

## Immutable source

- Repository: [botpress/skills](https://github.com/botpress/skills)
- Source branch observed during selection: `master`
- Tag: `v2.0.7`
- Commit: `79abe10503bf6dc70486737c94159322e108e496`
- Upstream plugin and `skills.json` version: `2.0.7`
- License: MIT, including the exact `Copyright (c) 2026 Botpress` notice
- Distribution owner: `mazemax`, community-maintained and not endorsed by Botpress

`UPSTREAM.json` is the machine-readable source of truth for the managed-file map, counts, and SHA-256 hashes. The root `LICENSE` is copied verbatim.

## Resolved inventory

The actual pinned tree contains **six skill directories and 62 skill-tree files**:

1. `adk`
2. `adk-debugger`
3. `adk-dev-console`
4. `adk-docs`
5. `adk-evals`
6. `adk-frontend`

It contains **12 official command files**: `adk-build`, `adk-debug`, `adk-dev-console`, `adk-document`, `adk-eval`, `adk-explain`, `adk-frontend`, `adk-init`, `adk-integration`, `adk-ship`, `adk-test`, and `adk-validate`.

The upstream `README.md` “Available Skills” section describes only five skills and omits `adk-dev-console`, while the actual tree and core-skill command list include it. No seventh skill has been invented to reconcile external documentation with the package. Distribution inventory claims are based on the pinned tree.

## Static content review

All six `SKILL.md` files and all 12 command bodies were read. Targeted reference inspection covered deployment, integration/plugin mutation, credentials, and external execution. See `docs/side-effects.md` for the workflow matrix and the core-skill `adk deploy --yes` review concern.

No upstream script was executed, no ADK production workflow was run, and no upstream file was rewritten for this distribution. Actual CLI/host behavior remains a separate verification gate.

## Maintainer verification

```bash
npm run validate
npm run sync:verify
```

The first command verifies local recorded hashes and inventory; the second fetches the immutable public commit and compares source and local bytes without executing upstream code.
