# Update, rollback, duplicate installs, and uninstall

Back up any host configuration you change and record the current package version, install source, and upstream SHA. Update one host at a time and verify in a fresh session.

## Cursor local development copy

After replacing files under `~/.cursor/plugins/local/botpress-adk-community`, restart Cursor or run **Developer: Reload Window**, then inspect **Customize** in a fresh session. Keep real directories inside the local-plugin root; an external repository symlink can be skipped.

For removal, remove that local plugin directory after closing the relevant host session, reload, and verify that its skills no longer appear. Record any host cache residue rather than assuming removal is complete. Marketplace update/uninstall instructions will be verified only after a listing exists; no listing is currently claimed.

## Rollback

Use a previously tested immutable tag/commit rather than an arbitrary branch tip. Reinstall or select that source using the verified host flow, restart/reload, and repeat discovery plus the golden path. A rollback must not silently change the upstream ADK snapshot: compare both `UPSTREAM.json` files and review side-effect differences.

## Duplicate installations

Use one intentional installation source per host profile where practical. Inspect personal, project, and plugin skill directories for duplicate names and remove stale copies. Record precedence/cache behavior from actual host evidence instead of guessing.

## Verification after update or removal

Confirm package version, expected six-skill inventory (or absence after removal), fresh-conversation activation, and any remaining host configuration/cache entries. Update `docs/compatibility.md` only with observed results. The distribution's own scripts never modify host installation or global configuration.
