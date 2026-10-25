# Botpress ADK Community for Cursor

**Community-maintained by [mazemax](https://github.com/mazemax); not endorsed by Botpress.**

A production-oriented community distribution of the official [Botpress ADK skills](https://github.com/botpress/skills) for Cursor, with 12 host-native commands, immutable provenance, explicit side-effect guidance, validation tooling, and honest compatibility evidence.

**Current status:** `1.0.0-rc.1` release candidate. Native command generation and local-plugin documentation are implemented; clean Cursor installation, command invocation, model behavior, external beta, and marketplace review are not verified. Do not interpret the manifest, generated files, or static checks as production readiness.

## Included official content

Upstream `v2.0.7` at commit `79abe10503bf6dc70486737c94159322e108e496` provides six skills and 62 skill-tree files:

| Skill | Developer workflow |
|---|---|
| `adk` | ADK architecture, primitives, integrations, configuration, build/init/validate/test guidance |
| `adk-debugger` | Logs, traces, systematic diagnosis, and regression-guided debugging |
| `adk-dev-console` | Dev Console pages, Agent Steps, traces, and multi-agent UI concepts |
| `adk-docs` | Create, review, update, synchronize, and search project documentation |
| `adk-evals` | Official ADK eval format, assertions, and live-dev testing guidance |
| `adk-frontend` | Botpress frontend authentication, typed clients, action calls, and state patterns |

The 12 official Claude Code commands remain under `upstream/commands/` as read-only sources. `npm run generate:commands` mechanically adapts them into Cursor's auto-discovered `commands/` directory with `name` and `description` frontmatter; drift checks reject missing, extra, or manually edited generated files. No agents, rules, hooks, MCP servers, or replacement ADK knowledge are added.

## Install and first success

Follow [the Cursor quickstart](docs/quickstart.md), then use the [workflow guide](docs/workflows.md) and [real-host checklist](tests/host-checklists/cursor.md). The documented local flow copies the plugin into `~/.cursor/plugins/local/botpress-adk-community`. Marketplace installation is unavailable until separate review and approval; no listing is claimed.

Start with a read-oriented ADK question or select an `adk-*` entry from the `/` picker in a fresh session. For project work, use a disposable ADK directory, synthetic data, and a dedicated non-production workspace.

## What this plugin does not do

- It is not an official Botpress product, support channel, or endorsement.
- It does not bundle the ADK CLI, a Botpress account, an MCP server, agents, hooks, a doctor, or a new Eval CI product.
- It does not rewrite or replace the official ADK knowledge base.
- It does not make production deployment safe or automatic. `adk-ship` requires deliberate review and separate explicit confirmation.
- It does not claim untested hosts, models, operating systems, activation rates, or marketplace approval.

## Safety and privacy

Review the [side-effect inventory](docs/side-effects.md): official workflows can write files, execute commands, access linked workspaces, mutate dev/prod dependencies, insert test data, or deploy. This distribution adds no telemetry or remote maintainer service; see [privacy and data handling](PRIVACY.md).

## Maintenance and trust

- [Exact upstream provenance](review/provenance.md) and machine-readable `UPSTREAM.json`
- [Compatibility and untested configurations](docs/compatibility.md)
- [Evaluation methodology](docs/evaluation.md) and [context baseline](tests/results/context-baseline.json)
- [Update, rollback, duplicate-install, and uninstall guidance](docs/update-uninstall.md)
- [Troubleshooting](docs/troubleshooting.md), [support](SUPPORT.md), and [security reporting](SECURITY.md)
- [Changelog](CHANGELOG.md), [roadmap](ROADMAP.md), and [release gates](review/release-checklist.md)

## License and attribution

The upstream MIT `LICENSE`, including `Copyright (c) 2026 Botpress`, is preserved verbatim. See [NOTICE.md](NOTICE.md) for upstream attribution and community packaging ownership. The neutral logo is original community artwork.
