# Changelog

All notable distribution changes are recorded here. Upstream ADK changes are identified separately from community packaging changes.

## [1.0.0-rc.1] - Unreleased

### Added

- Initial community distribution foundation for Cursor.
- Verbatim `botpress/skills` snapshot at `v2.0.7` (`79abe10503bf6dc70486737c94159322e108e496`).
- Provenance inventory, SHA-256 verification, local reference checks, context measurements, and maintainer unit tests.
- Security, support, privacy, side-effect, compatibility, update, and uninstall documentation.
- Read-only upstream monitoring that prepares reviewed sync branches and pull requests without auto-merging.
- Twelve generated Cursor commands under `commands/`, with explicit names/descriptions, exact inventory/content drift checks, and unit tests.
- Host-specific local installation, workflow, troubleshooting, update, rollback, uninstall, and submission guidance with untested surfaces identified.
- Command purposes, prerequisites, side effects, candidate `/adk-*` invocation guidance, and copyable natural-language alternatives.

### Not yet verified

- Clean installation, command discovery/invocation, and golden paths in the real Cursor host.
- Model activation, negative-trigger, workflow, update, rollback, and uninstall behavior.
- External Botpress developer beta, Cursor Marketplace submission, and marketplace review.

This release candidate is not a stable release or a production-readiness claim.
