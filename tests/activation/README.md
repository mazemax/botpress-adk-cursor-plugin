# Activation cases

`cases.json` is the versioned Stage 3 routing inventory: 54 cases comprising 30 positive, 18 negative, and 6 overlap cases. Every official skill has explicit, natural-language, indirect, project-context, and workflow positives plus near-neighbor, non-Botpress, and unrelated-development negatives.

Each case declares a unique ID, literal prompt, expected/forbidden skills, repository-relative expected references, fresh-conversation isolation, and observable assertions. `npm run check:behavior` validates this structure and reference existence; it does not execute the prompts or claim live activation.

Run the inventory manually using the safety and metadata protocol in `docs/evaluation.md`. Store only sanitized observations under `tests/results/`, never credentials, private project content, or customer data. No live activation result is currently claimed.
