# Update, rollback, duplicate installs, and uninstall

Back up any host configuration you change and record the current package version, install source, and upstream SHA. Verify in a fresh session. The procedures below are documented local-development flows, not observed compatibility results for this release candidate.

## Cursor local development copy

After replacing the runtime payload under `~/.cursor/plugins/local/botpress-adk-community`, restart Cursor or run **Developer: Reload Window**, then inspect **Customize** and the `/` picker in a fresh session. Keep real directories inside the local-plugin root; an external repository symlink can be skipped.

For removal, close the relevant Cursor session, remove that local plugin directory, reload/restart, and verify that its six skills and 12 commands no longer appear. Record any host cache residue rather than assuming removal is complete. Marketplace update/uninstall instructions will be verified only after a listing exists; no listing is currently claimed.

## Rollback

Use a previously tested immutable tag/commit rather than an arbitrary branch tip. Replace the local payload, including `cursor/skills/`, with that revision using the verified host flow, restart/reload, and repeat skill/command discovery plus the golden path. A rollback must not silently change the upstream ADK snapshot: compare both `UPSTREAM.json` files and review generated-skill, generated-command, and side-effect differences.

## Duplicate installations

Use one intentional installation source per host profile where practical. Inspect personal, project, local-plugin, and any future marketplace components for duplicate names and remove stale copies through their owning interface. Record precedence/cache behavior from actual host evidence instead of guessing.

## Verification after update or removal

Confirm package version, expected six-skill and 12-command inventory (or absence after removal), fresh-conversation activation, and any remaining host configuration/cache entries. Update `docs/compatibility.md` only with observed results. The distribution's own scripts never modify host installation or global configuration.
