# Architecture and change boundaries

## Layers

1. **Canonical upstream content** — `botpress/skills` at `v2.0.7`, commit `79abe10503bf6dc70486737c94159322e108e496`.
2. **Managed snapshot** — verbatim `skills/`, read-only source commands in `upstream/commands/`, upstream metadata in `upstream/`, and the original `LICENSE`.
3. **Community distribution** — the Cursor manifest at `.cursor-plugin/plugin.json`, documentation, neutral artwork, validation, tests, and release/support processes.

`UPSTREAM.json` maps every managed local file to its upstream path and SHA-256 hash. `distribution.json` describes only this host distribution; it is not a host manifest extension.

## Why commands are under `upstream/`

The pinned repository contains 12 official Claude Code commands. They are retained as source evidence, not loaded as Cursor components in Stage 1. This prevents accidentally treating Claude-specific command syntax as portable. Stage 2 may mechanically adapt them only where the approved host supports commands; Codex remains skills-only.

## Validation boundaries

- `validate.ts` checks the manifest, package inventory, frontmatter, attribution, forbidden component types, workflow action pins, and recorded hashes.
- `check-references.ts` resolves local Markdown links and `references/*.md` mentions in each `SKILL.md`.
- `measure-context.ts` measures discovery descriptions and full skill/reference sizes. Token figures are explicitly rough estimates, not provider tokenization.
- `sync-upstream.ts --verify` fetches the exact upstream commit and compares bytes without running upstream code.
- Unit tests exercise only community maintainer tooling with temporary local fixtures.

## Sync and release

The scheduled sync checks the public `master` branch, applies a candidate only to a review branch, runs checks, and opens a pull request. It never auto-merges. A human must review the upstream diff and side-effect implications.

Tag releases run validation and create a source snapshot with checksums. A source snapshot is not a marketplace submission, an approval, or a production-readiness claim.
