# Release checklist

Release candidate: `1.0.0-rc.1`. Do not mark an item complete without linked, observed evidence at the release revision.

## Deterministic and provenance gates

- [ ] `npm ci` and `npm run check` pass on the release revision.
- [ ] `npm run sync:verify` confirms every managed file against `79abe10503bf6dc70486737c94159322e108e496` or a newly reviewed sync commit.
- [ ] CI is green on the immutable tag/SHA; all GitHub Actions are pinned and tokens are least-privilege.
- [ ] License, `NOTICE.md`, `UPSTREAM.json`, community status, and publisher metadata are correct.
- [ ] Package inventory contains no secrets, symlinks, binaries, telemetry, MCP, agents, hooks, or unexpected host components.
- [ ] Reference and context reports were reviewed; no unexplained growth remains.

## Host and behavior gates

- [ ] Clean Cursor installation and expected skill discovery pass on the declared support matrix.
- [ ] The documented golden path passes with synthetic data and no production deployment.
- [ ] Direct, indirect, negative, overlap, and safety cases meet published thresholds.
- [ ] Update, rollback, duplicate-install, and uninstall behavior pass with residue documented.
- [ ] Compatibility results identify host/version, OS, model, package/upstream revisions, and untested configurations.

## Production and review gates

- [ ] At least one external Botpress developer completes the public-quickstart beta for this host; findings are fixed or explicitly block production scope.
- [ ] Quickstart screenshots/recording are current and sanitized.
- [ ] Changelog, known issues, support/security routes, side effects, and release evidence are current.
- [ ] The immutable tested revision is submitted through `cursor-submission.md`; no submission is represented as approval.
- [ ] Marketplace findings are resolved and the installed public listing is verified after approval.
- [ ] Post-release support, compatibility, and upstream review cadence are active.

Until applicable production gates pass, keep the version at release-candidate status and do not use a production-ready claim.
