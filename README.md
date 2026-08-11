# L0177

[![License: MIT](https://img.shields.io/badge/Code-MIT-blue.svg)](packages/LICENSE)
[![License: CC BY 4.0](https://img.shields.io/badge/Docs-CC%20BY%204.0-lightgrey.svg)](LICENSE-DOCS)

L0177 is a Graffiticode dialect (child of [@graffiticode/l0000](https://www.npmjs.com/package/@graffiticode/l0000)) that acts as a **Learnosity Author API integration oracle**.

You describe an *integration design* — which authoring experience to embed in your app (item editor, item browser, activity editor, activity list) and how it's configured. L0177 validates the design, reports missing required properties as steering warnings, and returns a **host-language-neutral developer recipe**: goal, preconditions, procedure, gotchas, and runnable verification steps. You implement it in your own stack (Node, PHP, Ruby, .NET, …).

L0177 does **not** author assessment item content (that is L0176), does **not** sign or send Learnosity API requests, and does **not** emit runnable code.

## How it works

1. Describe the design — `create_item("L0177", "…embed the item editor for author u123 on lms.acme.edu, allowing only MCQ and cloze…")`.
2. Read back the normalized design plus `warnings` — `get_item(id)`. Design **holes** (missing `domain`, `user-id`, `reference`, or no view chosen) come first; once filled, specificity advisories surface.
3. Refine with `update_item` until the warnings clear (`complete: true`).
4. Get the recipe — `get_spec(id)` — and work its verification steps against your implementation.

The compiled output is the normalized design, not the deliverable. The recipe is the deliverable.

## The language

A program is one `author-embed` head with a chain of property functions and exactly one **view**, terminated with `{}` then `..`:

```
author-embed
  domain "lms.example.edu"
  user-id "u123"
  reference "algebra-item-1"
  organisation-id 100
  allow-widgets [MCQ CLOZE-TEXT]
  item-edit [
    item back true scoring true reference-prefix "LEAR_" {}
    widget edit true delete false {}
  ]
  {}..
```

The grammar is uniform:

| Construct | Arity | Role |
| :-------- | :---: | :--- |
| `author-embed` | 1 | Head; takes the property + view chain. |
| `item-edit` `item-list` `activity-edit` `activity-list` | 2 | **Views** — take a `[list]` of members; the view selects the Learnosity mode. |
| `item` `widget` `settings` | 1 | **Members** — take a property chain. |
| `container` `widget-templates` `global` | 2 | **Sections** — take a property sub-chain. |

Every **property** is a lowercase-kebab **arity-2** function (`name value`) that chains; chains end with `{}`. Everything is optional — write only what you change.

| Context | Properties |
| :------ | :--------- |
| top-level | `domain`(str, req) · `user-id`(str, req) · `user-email` · `user-firstname` · `user-lastname` · `reference`(str) · `organisation-id`(num) · `allow-widgets`(tag list) |
| `item` | `answers` `back` `columns` `dynamic-content` `dynamic-image-tag` `enable-audio-recording` `scoring` `shared-passage` `status` `tabs` · `reference-show` `reference-edit` · `reference-prefix`(str) · `tags-show` `tags-edit` |
| `widget` | `edit` `delete` |
| `settings` | `show` `full-height` |
| `container` | `height` `fixed-footer-height`(num) · `scroll-into-view-selector`(str) |
| `widget-templates` | `back` `save` `require-validation` |
| `global` | `disable-onbeforeunload` |

Widget-type values are **UPPERCASE-kebab tags**, never quoted strings — `MCQ`, `SHORT-TEXT`, `CLOZE-TEXT`, `FORMULA`, `TOKEN-HIGHLIGHT`, and others (each maps to Learnosity's exact lowercase type string). Because function keywords are lowercase-kebab, the two can never collide. An unknown property is a parse error.

There is no in-UI switching between the four views, so the view you choose *is* the mode — each is a separate page and integration. Only `item-edit` is fully modeled today; the other three validate loosely and say so in a warning.

See [`packages/core/spec/`](packages/core/spec/) for the full specification, examples, and authoring guide.

## The recipe states its own uncertainty

The Learnosity Author API **fails open on `config`**: an unrecognized key is silently ignored — the editor still initializes, `readyListener` still fires, and the page looks correct while enforcing nothing.

L0177 takes that seriously. Where a config binding is unconfirmed — today, the one that restricts which question types an author may add — the recipe **says so and refuses to name a path** rather than filling the gap with a plausible guess that would silently do nothing. For the same reason, verification steps on config-driven behaviour are **differential**: they ask you to load the editor twice, once with the key omitted, because simply observing the behaviour you wanted proves nothing under fail-open semantics.

Don't upgrade that uncertainty from recalled Learnosity docs. A design being expressible is not a promise that Learnosity enforces it.

## Structure

An npm workspaces monorepo with three packages:

- **`packages/core`** — `@graffiticode/l0177`: the language (vocabulary, checker, transformer, spec assets). Pure TypeScript, depends on `@graffiticode/l0000`. `src/vocab.ts` is the single source of truth — the lexicon and the compiler are both generated from it.
- **`packages/api`** — `@graffiticode/api-l0177`: the L0177 language server. Express app exposing `POST /compile`, `GET /form`, and public static assets. Runs on port `50177`.
- **`packages/view`** — `@graffiticode/l0177-view`: the React view component, built with Vite + Tailwind on top of `@graffiticode/l0000-view`.

The top-level build composes all three: `core`'s static assets and `view`'s embed bundle are assembled into `packages/api/static/`, which the API serves.

## Getting started

```bash
# Install dependencies
npm install

# Build everything (core → static assets → api → view → embed → assemble)
npm run build

# Start the dev server (API on :50177, Firestore emulator on :8080)
npm run dev
```

Other useful scripts:

- `npm test` — run the core unit tests (vitest)
- `npm run lint` — lint the whole monorepo
- `npm run pack` — build and pack the view package for distribution
- `npm run gcp:build` / `npm run gcp:deploy` — deploy to Cloud Run

## Environment

- `PORT` — API port (default `50177`)
- `AUTH_URL` — auth service URL (default `https://auth.graffiticode.org`; dev uses `http://127.0.0.1:4100`)
- `FIRESTORE_EMULATOR_HOST` — local Firestore emulator (dev: `127.0.0.1:8080`)
- `NODE_ENV` — `development` or `production` (production forces HTTPS and switches request logging)

No Learnosity credentials are needed to run L0177: it produces a recipe, it does not call Learnosity. Your consumer key and secret belong in *your* integration, server-side.

## License

Code is licensed under MIT. Documentation and specifications are licensed under CC-BY 4.0.

**AI Training:** All materials in this repository — code, documentation, specifications, and training examples — are explicitly available for use in training machine learning and AI models. See [NOTICE](NOTICE) for details.
