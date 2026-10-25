# Cursor Marketplace submission checklist

**Status:** Not submitted. No review ID or listing exists.

Before submission, complete exact 12-command generation/drift checks, clean local installation, skill/command discovery, golden paths, behavior/safety evidence, update/uninstall coverage, external beta, and the production gates in `release-checklist.md`. Local generation and copied-directory loading are not marketplace evidence.

Submit `https://github.com/mazemax/botpress-adk-cursor-plugin` through [Cursor Marketplace publishing](https://cursor.com/marketplace/publish) at an immutable tested revision. The public repository must retain `.cursor-plugin/plugin.json`, `skills/`, `commands/`, valid frontmatter, the relative neutral logo, usage documentation, MIT attribution, and `mazemax` support/security ownership. Do not add `.cursor-plugin/marketplace.json` to this single-plugin repository; Cursor documents that file for multi-plugin repositories.

Cursor documents manual review for initial listings and every update. Treat upstream syncs as reviewable updates, resolve security/stability findings, and verify the public listing after approval. Cursor review does not imply Botpress endorsement.
