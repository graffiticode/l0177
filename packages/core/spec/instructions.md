<!-- SPDX-License-Identifier: CC-BY-4.0 -->
# Dialect L0177 — Learnosity Author API integration (recipe oracle)

L0177 does **not** author item content (that is L0176). The client describes an *integration design* — which Learnosity **Author API** authoring experience to embed in their app, and how it's configured. L0177 validates the design, flags **holes** (missing required properties) as steering warnings, and — via `get_spec` — returns an **implementation recipe with verification steps**.

## Program shape (uniform grammar)

A program is one `author-embed` head with a chain of property functions and exactly one **view** function, terminated with `{}` then `..`:

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

Uniform rules:
- **Every property is a lowercase-kebab arity-2 function** — `name value` — that chains; a chain ends with `{}`.
- **Members** (`item`, `widget`, `settings`) are arity-1: they take a property chain (`item back true … {}`).
- **Views** and **sections** are arity-2. A **view** takes a `[list]` of members.
- **Widget-type values are UPPERCASE-kebab tags** (`MCQ`, `CLOZE-TEXT`), never quoted strings.
- **Smart defaults**: everything is optional; `item {}` is a fully-defaulted item. Write only what you change.

## The view selects the mode (one per program)

There is no in-UI view switching, so the view you use *is* the mode:
- `item-edit [ … ]` — the **Item editor** (create/edit one item). Needs a `reference`.
- `item-list [ … ]` — the **Item browser/list**.
- `activity-edit [ … ]` — the **Activity editor**. `reference` optional.
- `activity-list [ … ]` — the **Activity browser/list**.

(`item-list`/`activity-edit`/`activity-list` are only partially modeled; their members pass through with a note.)

## Property functions

**Top-level** (in the `author-embed` chain):
- **`domain`** (string, required) — the host serving the editor; the signature binds to it.
- **`user-id`** (string, required) — the author's stable id (recorded in the item-bank audit trail). Also `user-email`, `user-firstname`, `user-lastname` (optional).
- **`reference`** (string) — the item/activity to edit (required for `item-edit`).
- **`organisation-id`** (number) — which item bank to load from.
- **`allow-widgets`** (list of widget-type **tags**) — restrict the question types authors can add.

**`item` member** (all optional booleans unless noted): `answers`, `back`, `columns`, `dynamic-content`, `dynamic-image-tag`, `enable-audio-recording`, `scoring`, `shared-passage`, `status`, `tabs`; `reference-show`, `reference-edit`; `reference-prefix` (string); `tags-show`, `tags-edit`.

**`widget` member**: `edit`, `delete` (booleans).

**`settings` member**: `show`, `full-height` (booleans).

**Sections** (arity-2, top level): `container` (`height`, `fixed-footer-height` numbers; `scroll-into-view-selector` string); `widget-templates` (`back`, `save`, `require-validation` booleans); `global` (`disable-onbeforeunload` boolean).

**Widget-type tags** (the DSL authoring values; each maps to Learnosity's lowercase type string — lowercase, hyphens removed): `MCQ, SHORT-TEXT, LONG-TEXT, PLAIN-TEXT, CLOZE-TEXT, CLOZE-ASSOCIATION, CLOZE-DROPDOWN, CLOZE-FORMULA, CLOZE-INLINE-TEXT, CHOICE-MATRIX, CLASSIFICATION, ORDER-LIST, SORT-LIST, FORMULA, GRAPH-PLOTTING, HIGHLIGHT-TEXT, HOTSPOT, TOKEN-HIGHLIGHT, NUMBER-LINE, ASSOCIATION, FILL-IN-THE-BLANKS, IMAGE-CLOZE-ASSOCIATION, IMAGE-CLOZE-TEXT`.

Map the client's request to the right view and set the properties they gave. **Do not invent `domain`, `user-id`, or `reference`** — omit them and the compiler flags them as design holes for the client to supply.

## Warnings are repair signals

The compiler returns `data.warnings` — imperative, specific steering hints. **Design holes (missing required properties) come first**; once filled, specificity advisories (restrict widget types, pick an item bank) surface. The client reads them and refines the design (via `update_item`) until it's complete. (A truly-unknown property is a parse error, not a warning — every valid property is a function.)

## Canonical Learnosity Author API knowledge (the recipe draws on this)

- **Init:** server-side, build a signed request and call `LearnosityAuthor.init(initObject, callbacks, "learnosity-author")`. `initObject = { security, request: { mode, reference?, config, user } }`.
- **Signing is SDK-handled:** use the official Learnosity **server-side SDK** for your language (.NET / Java / Node.js / PHP / Python / Ruby) to generate the `security` object from your consumer key + secret. Do not hand-roll signing unless unavoidable.
- **`security`** = `{ consumer_key, domain, timestamp (UTC, `YYYYMMDD-HHMM`), signature }`. The consumer **secret** signs the request but is **never** sent to the browser. `domain` MUST equal the host actually serving the page — a mismatch is the **#1 cause of a 401**.
- **`mode`** selects the view; there is no in-UI switch between the item/activity list/edit views — build a separate page/init per experience.
- **Widget-type restriction** maps into `config.dependencies.question_editor_api`/`questions_api.init_options.widgetTypes` (kept consistent with `widget_templates`). **CRITICAL — the `widgetTypes` values are Learnosity's EXACT lowercase strings. Copy them from this table; do NOT derive them, do NOT uppercase them, do NOT add underscores:**

  | DSL tag | Learnosity `widgetTypes` value |
  |---|---|
  | `MCQ` | `mcq` |
  | `SHORT-TEXT` | `shorttext` |
  | `LONG-TEXT` | `longtext` |
  | `PLAIN-TEXT` | `plaintext` |
  | `CLOZE-TEXT` | `clozetext` |
  | `CLOZE-ASSOCIATION` | `clozeassociation` |
  | `CLOZE-DROPDOWN` | `clozedropdown` |
  | `CLOZE-FORMULA` | `clozeformula` |
  | `CLOZE-INLINE-TEXT` | `clozeinlinetext` |
  | `CHOICE-MATRIX` | `choicematrix` |
  | `CLASSIFICATION` | `classification` |
  | `ORDER-LIST` | `orderlist` |
  | `SORT-LIST` | `sortlist` |
  | `FORMULA` | `formula` |
  | `GRAPH-PLOTTING` | `graphplotting` |
  | `HIGHLIGHT-TEXT` | `highlighttext` |
  | `HOTSPOT` | `hotspot` |
  | `TOKEN-HIGHLIGHT` | `tokenhighlight` |
  | `NUMBER-LINE` | `numberline` |
  | `ASSOCIATION` | `association` |
  | `FILL-IN-THE-BLANKS` | `fillintheblanks` |
  | `IMAGE-CLOZE-ASSOCIATION` | `imageclozeassociation` |
  | `IMAGE-CLOZE-TEXT` | `imageclozetext` |

  Example: the design `allow-widgets [MCQ CLOZE-TEXT]` becomes `widgetTypes: ["mcq", "clozetext"]` — **RIGHT**. Writing `["MCQ", "CLOZE_TEXT"]` or `["MCQ", "CLOZE-TEXT"]` is **WRONG**.
- **Client-side wiring:** provide a `readyListener` (fires when initialized) and an `errorListener` (`e.code` / `e.message` / `e.name`); optionally `assetRequest` (your DAM) and `customButtons`.

### Gotchas
- `domain` mismatch → 401.
- consumer secret exposed to the browser → security hole (server-only).
- stale/skewed timestamp → failure (use UTC, fresh per request).
- no `errorListener` → init failures are silent.

### Acceptance criteria (what "done" looks like)
- `readyListener` fires with no error and the editor renders in your target element.
- `errorListener` catches a deliberately-tampered signature (a 401-class error).
- the init payload sent to the browser contains no consumer secret.
- the `domain` in `security` equals the host serving the page.

OUT_OF_SCOPE: authoring item **content** (→ L0176); assessment delivery and analytics (future L0177 modes); emitting runnable host-language code (the recipe is language-neutral).
