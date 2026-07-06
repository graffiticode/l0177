<!-- SPDX-License-Identifier: CC-BY-4.0 -->
# Dialect L0177 — Learnosity Author API integration (recipe oracle)

L0177 does **not** author item content (that is L0176). The client describes an *integration design* — which Learnosity **Author API** authoring experience to embed in their app, and how it's configured. L0177 validates the design, flags **holes** (missing required properties) as steering warnings, and — via `get_spec` — returns an **implementation recipe with verification steps**.

## The four constructs (one per Author API mode)

A program is exactly one construct taking a record, terminated with `..`. The Author API has **no in-UI view switching**, so each experience is a separate integration (a separate page/init):

- `author-item-edit { … }` — embed the **Item editor** (create/edit one item). Requires `reference`.
- `author-item-list { … }` — embed the **Item browser/list**.
- `author-activity-edit { … }` — embed the **Activity editor**. `reference` optional (omit = new activity; set = edit existing).
- `author-activity-list { … }` — embed the **Activity browser/list**.

## Design record fields

Shared (all constructs):
- **`domain`** (string, required) — the host serving the editor; the Author API signature binds to it.
- **`user`** (record, required) — `{ id (required), email?, firstname?, lastname? }`; the author, recorded in the item-bank audit trail.
- **`organisation_id`** (number, optional) — which item bank to load from.
- **`locked`** (boolean, optional) — initialize in locked (read-only) edit mode (for review/preview).

Editing constructs only (`author-item-edit`, `author-activity-edit`):
- **`reference`** (string) — the item/activity to edit, or a new reference to create.
- **`allow_widgets`** (list) — restrict the question types authors can add (subset of the widget types below). The compiler maps this single list to `config.dependencies.questions_api.init_options.widgetTypes`, `config.widget_templates.filter.widgettype`, and `config.item_edit.widget_types.enabled`.
- editor permissions (booleans): `edit_widgets`, `delete_widgets`, `edit_tags`, `show_tags`, `dynamic_content`, `shared_passage`.

Widget types: `mcq, shorttext, longtext, plaintext, clozetext, clozeassociation, clozedropdown, clozeformula, clozeinlinetext, choicematrix, classification, orderlist, sortlist, formula, graphplotting, highlighttext, hotspot, tokenhighlight, numberline, association, fillintheblanks, imageclozeassociation, imageclozetext`.

Example:
```
author-item-edit {
  domain: "lms.acme.edu",
  user: { id: "u123" },
  reference: "algebra-item-1",
  allow_widgets: ["mcq", "clozetext"],
  edit_widgets: true, delete_widgets: false,
  organisation_id: 100
}..
```

Map the client's request to the closest construct and fill the fields they gave. **Do not invent `domain`, `user`, or `reference`** — leave them out, and the compiler flags them as design holes for the client to supply.

## Warnings are repair signals

The compiler returns `data.warnings` — imperative, specific steering hints. **Design holes (missing required properties) come first**; once filled, specificity advisories (restrict widget types, set permissions, pick an item bank) surface. The client reads the warnings and refines the design (via `update_item`) until it's complete.

## Canonical Learnosity Author API knowledge (the recipe draws on this)

- **Init:** server-side, build a signed request and call `LearnosityAuthor.init(initObject, callbacks, "learnosity-author")`. `initObject = { security, request: { mode, reference?, config, user } }`.
- **Signing is SDK-handled:** use the official Learnosity **server-side SDK** for your language (.NET / Java / Node.js / PHP / Python / Ruby) to generate the `security` object from your consumer key + secret. Do not hand-roll signing unless unavoidable.
- **`security`** = `{ consumer_key, domain, timestamp (UTC, `YYYYMMDD-HHMM`), signature }`. The consumer **secret** signs the request but is **never** sent to the browser. `domain` MUST equal the host actually serving the page — a mismatch is the **#1 cause of a 401**.
- **`mode`** selects the view; there is no in-UI switch between the item/activity list/edit views — build a separate page/init per experience.
- **Widget-type restriction:** `config.dependencies.questions_api.init_options.widgetTypes` (+ `config.widget_templates.filter.widgettype` + `config.item_edit.widget_types.enabled`), kept consistent.
- **Client-side wiring:** provide a `readyListener` (fires when initialized) and an `errorListener` (`e.code` / `e.message` / `e.name`); optionally `assetRequest` (your DAM) and `customButtons`.

### Gotchas
- `domain` mismatch → 401.
- consumer secret exposed to the browser → security hole (server-only).
- stale/ skewed timestamp → failure (use UTC, fresh per request).
- no `errorListener` → init failures are silent.

### Acceptance criteria (what "done" looks like)
- `readyListener` fires with no error and the editor renders in your target element.
- `errorListener` catches a deliberately-tampered signature (a 401-class error).
- the init payload sent to the browser contains no consumer secret.
- the `domain` in `security` equals the host serving the page.

OUT_OF_SCOPE: authoring item **content** (→ L0176); assessment delivery and analytics (future L0177 modes); emitting runnable host-language code (the recipe is language-neutral).
