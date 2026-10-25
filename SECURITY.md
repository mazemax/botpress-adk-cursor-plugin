# Security policy

## Supported scope

Security fixes are considered for the newest release candidate on `main` and the newest tagged release. Older releases must be upgraded or explicitly assessed before a fix is promised.

## Report privately

Email **to.msaads@gmail.com**, the public contact on [mazemax's GitHub profile](https://github.com/mazemax). Do not open a public issue for an unpatched vulnerability.

Include the repository, affected version and upstream SHA, host/version, impact, a minimal reproduction, and any suggested mitigation. Remove credentials, private source code, personal data, and real workspace identifiers from the report.

The maintainer target is acknowledgment within **two business days**. This is a response target, not a guaranteed remediation or disclosure timeline. Coordinate validation and disclosure before publishing details.

## Supply-chain boundaries

- The upstream source is pinned by a full commit and SHA-256 file inventory.
- Sync automation fetches content but does not execute upstream scripts or auto-merge.
- This distribution adds no telemetry, runtime downloader, binary, MCP server, agents, or hooks.
- Routine tests require no Botpress token and must never deploy or mutate a real user workspace.
- Upstream ADK workflows can execute commands and mutate local or remote state; read `docs/side-effects.md` before use.

Botpress ADK product vulnerabilities should also be reported through official Botpress channels. Do not assume Botpress monitors or supports this community repository.
