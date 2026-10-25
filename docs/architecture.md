# Architecture and change boundaries

## Layers

1. **Canonical upstream content** — `botpress/skills` at `v2.0.7`, commit `79abe10503bf6dc70486737c94159322e108e496`.
2. **Managed snapshot** — verbatim `skills/`, read-only source commands in `upstream/commands/`, upstream metadata in `upstream/`, and the original `LICENSE`.
3. **Community distribution** — the Cursor manifest at `.cursor-plugin/plugin.json`, documentation, neutral artwork, validation, tests, and release/support processes.

`UPSTREAM.json` maps every managed local file to its upstream path and SHA-256 hash. `distribution.json` describes only this host distribution; it is not a host manifest extension.

## Generated host commands

The pinned repository contains 12 official Claude Code commands under `upstream/commands/`; those sources remain verbatim and read-only. `generate-commands.ts` mechanically converts them into Cursor's auto-discovered `commands/` directory with explicit `name` and `description` frontmatter. It preserves the workflow bodies except for replacing literal Claude `$ARGUMENTS` tokens with `the command input` and rejects newly appearing unsupported frontmatter fields for review.

The generator rejects missing, extra, or manually edited generated files. Generated commands are host packaging, not new ADK capabilities; no agents, rules, hooks, MCP servers, or Codex commands are produced. Actual picker labels and `/adk-*` invocation behavior still require real-host evidence.

## Validation boundaries

- `generate-commands.ts --check` verifies the exact 12-file generated inventory and byte-for-byte content.
- `validate.ts` checks the manifest, package inventory, frontmatter, generated commands, attribution, forbidden component types, workflow action pins, and recorded hashes.
- `check-references.ts` resolves local Markdown links and `references/*.md` mentions in each `SKILL.md`.
- `measure-context.ts` measures discovery descriptions and full skill/reference sizes. Token figures are explicitly rough estimates, not provider tokenization.
- `sync-upstream.ts --verify` fetches the exact upstream commit and compares bytes without running upstream code.
- Unit tests exercise only community maintainer tooling with temporary local fixtures.

## Sync and release

The scheduled sync checks the public `master` branch, applies a candidate only to a review branch, runs checks, and opens a pull request. It never auto-merges. A human must review the upstream diff and side-effect implications.

Tag releases run validation and create a source snapshot with checksums. A source snapshot is not a marketplace submission, an approval, or a production-readiness claim.
