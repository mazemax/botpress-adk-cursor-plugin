# Cursor real-host checklist

**Status:** Not run. Record one result per host/version, OS, model, package version, upstream SHA, install SHA, and date. Use a clean profile, disposable ADK project, synthetic data, and dedicated non-production workspace.

## Install and discovery

- [ ] Install only from the documented public source in `docs/quickstart.md`.
- [ ] Restart/reload and start a fresh conversation.
- [ ] Record install success/failure and exact version/source.
- [ ] Verify all six expected skills are discoverable; record missing or duplicate components.
- [ ] Verify only intended references load for a focused question.
- [ ] Commands are Stage 2 scope and must be checked separately after conversion.

## Read-oriented activation

- [ ] Explicit ADK request activates `adk`.
- [ ] Natural-language debugging request activates `adk-debugger` and core ADK as appropriate.
- [ ] Dev Console question activates `adk-dev-console`.
- [ ] Documentation, eval, and frontend requests route to their respective skills.
- [ ] Non-Botpress and near-neighbor requests remain quiet or route appropriately.
- [ ] Record model, repetitions, expected/actual behavior, and sanitized evidence.

## Disposable golden path

- [ ] Inspect or initialize a disposable ADK project without exposing credentials.
- [ ] Build one small primitive after reviewing proposed writes.
- [ ] Run static validation and inspect actual diagnostics.
- [ ] Run one synthetic dev-only invocation and verify the trace exercised the intended primitive.
- [ ] Confirm cleanup of scratch files/test rows and no unexpected external changes.
- [ ] Do **not** run production deployment or `adk-ship`.

## Update, rollback, and removal

- [ ] Update from a prior tested revision and verify fresh-session discovery.
- [ ] Roll back to an immutable prior revision and compare `UPSTREAM.json`.
- [ ] Detect/resolve duplicate personal, project, and plugin skills.
- [ ] Uninstall and record remaining cache/configuration/residue.
- [ ] Publish sanitized results and limitations under `tests/results/`; untested items remain unchecked.
