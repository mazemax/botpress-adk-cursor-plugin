## Purpose

<!-- Describe the packaging, documentation, test, or reviewed-sync change. -->

## Verification

- [ ] `npm run check` passed locally or the limitation is explained.
- [ ] `npm run sync:verify` passed for a changed upstream snapshot.
- [ ] Real-host/model results are attached, or explicitly marked untested.
- [ ] Documentation and compatibility claims match observed evidence.
- [ ] No secrets, private project data, sensitive transcripts, or unsupported claims are included.

## Boundaries

- [ ] Synced upstream files were not manually edited.
- [ ] No doctor, Eval CI product, MCP, agents, hooks, telemetry, or new ADK capability was added.
- [ ] No production deployment or real-user workspace mutation was performed.
- [ ] Side effects and update/uninstall impacts were reviewed.

## Upstream and release metadata

<!-- Record upstream SHA/tag, distribution version, host/version/model where applicable, and follow-up gates. -->
