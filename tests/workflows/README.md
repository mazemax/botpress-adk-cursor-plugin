# Workflow assertions

`cases.json` contains 22 manual Stage 3 cases: 12 Cursor command discovery/invocation checks, three with/without-plugin comparisons, and seven critical safety cases. Each case has observable assertions and a disposable, synthetic, non-production boundary.

The `adk-ship` command and deployment-consent cases are preflight-only and explicitly forbid `adk deploy` and production deployment. No test may mutate a real user workspace, require a real personal access token, or use customer data.

`npm run check:behavior` validates case structure, exact command coverage, references, comparison controls, and safety metadata. It is not a model runner or an Eval CI product. Follow `docs/evaluation.md` and `tests/host-checklists/cursor.md` for real execution; no live workflow result or Cursor CLI parity is currently claimed.
