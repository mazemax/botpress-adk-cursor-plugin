# Roadmap

The roadmap improves packaging and developer experience without adding a doctor product, Eval CI product, MCP server, agents, hooks, or new ADK capabilities.

## Stage 0 — Baseline

- Pin upstream `v2.0.7` at `79abe10503bf6dc70486737c94159322e108e496`.
- Resolve the shipped inventory: six skills, 62 skill-tree files, and 12 official commands.
- Publish the static side-effect review and known limitations.

## Stage 1 — Repository foundation

- Establish the Cursor manifest, attribution, provenance, validation, support, security, and release workflows.
- Run deterministic tests and record real-host coverage honestly.

## Stage 2 — Host-native developer experience

- Complete and test the Cursor quickstart, workflow guide, troubleshooting, update, rollback, and uninstall paths.
- Add only the host-specific packaging required by the approved plan.
- Produce current screenshots and review materials from verified workflows.

## Stage 3 — Behavior, safety, and compatibility

- Run direct, indirect, negative, overlap, and safety cases with recorded host/model/date metadata.
- Test representative golden paths with and without the distribution.
- Publish results and limitations; structural checks are never presented as behavior results.

## Stage 4 — External beta and hardening

- Recruit at least one external Botpress developer for this host.
- Measure public-quickstart completion, time to first success, routing mistakes, and update/uninstall outcomes.
- Keep the distribution at release-candidate status if external validation is unavailable.

## Stage 5 — Marketplace review

- Submit an immutable, tested revision through the official Cursor review route.
- Resolve reviewer findings without expanding product scope.

## Stage 6 — Operate

- Verify the approved listing, triage issues, review upstream syncs, and keep compatibility evidence current.
