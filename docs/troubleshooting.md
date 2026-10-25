# Troubleshooting

Start with `docs/compatibility.md`: an unverified host configuration is not a known-good installation.

## Plugin does not appear

**Possible causes:** Local plugin imports are not allowed, the manifest is not at the expected location, the host cached an older copy, the installation source is not the intended repository/tag, or an external symlink was skipped.

**Action:** Confirm `.cursor-plugin/plugin.json` exists in a real directory under `~/.cursor/plugins/local/botpress-adk-community`, replace any unsupported external symlink with a copied directory, reload/restart, and inspect **Customize**. Follow `docs/quickstart.md` and record the exact Cursor version.

## Skills are missing or the wrong skill activates

**Possible causes:** Duplicate personal/project/plugin skills with the same `name`, stale session state, an overly broad prompt, or a host discovery defect.

**Action:** Inventory other installed copies, remove duplicates through the owning interface, start a fresh conversation, and use the activation issue template with the prompt, expected skill, actual skill, host/model/version, and package SHA. Do not include private transcripts.

## A skill cannot find `references/*.md`

**Possible causes:** An incomplete copy, a symlink/source layout the host does not support, or packaging that omitted reference files.

**Action:** Verify the installed tree contains the reference under the same skill directory. Run `npm run check:references` in the source repository. Reinstall using real directories, not an unsupported external symlink.

## Commands are unavailable or will not invoke

**Possible causes:** The copied payload predates Stage 2 or omits `commands/`, the window/session is stale, or the candidate `/adk-*` form differs from the host's actual invocation.

**Action:** Verify all 12 generated Markdown files exist in the installed `commands/` directory, reload/restart, and open a fresh `/` picker. Select the displayed `adk-*` entry and record its exact label and successful typed form. In the source repository, run `npm run check:commands`; this proves generated content only, not host discovery. Record missing commands as a release-blocking host result even if a natural-language prompt works.

## ADK CLI is missing, outdated, or not authenticated

The plugin packages skills, not the ADK CLI or a Botpress account. Verify `adk --version`, follow official Botpress setup guidance, and check the intended workspace before retrying. Do not paste a PAT or `BOTPRESS_TOKEN` into an issue.

## Validation reports a provenance mismatch

Do not edit `skills/` or `upstream/` to make the error disappear. Restore the pinned files or prepare a reviewed upstream sync. `npm run sync:verify` compares against the immutable upstream commit.

## Update leaves stale behavior

Refresh the plugin source, reinstall where the host caches direct installs, restart/reload, and start a new conversation. Record both the old and new package/upstream revisions. See `docs/update-uninstall.md`.

## A workflow requests deployment or workspace mutation

Stop and inspect the target workspace, command, and side-effect matrix. `/adk-ship` is production deployment, not a build check. Unattended repository tests must never deploy or mutate a real user workspace.
