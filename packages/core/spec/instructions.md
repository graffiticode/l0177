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
- **Members** (`item`, `widget`, `settings`, `filter-restricted`, `toolbar`) are arity-1: they take a property chain (`item back true … {}`).
- **Views** and **sections** are arity-2. A **view** takes a `[list]` of members.
- **A bare property chain inside a view's list sets that view's own options** — `limit 25 {}` is not a member, it sets `config.item_list.limit`. Members configure a node *inside* the view; a bare chain configures the view itself.
- **Widget-type values are UPPERCASE-kebab tags** (`MCQ`, `CLOZE-TEXT`), never quoted strings.
- **Smart defaults**: everything is optional; `item {}` is a fully-defaulted item. Write only what you change.

## The view selects the mode (one per program)

There is no in-UI view switching, so the view you use *is* the mode:
- `item-edit [ … ]` — the **Item editor** (create/edit one item). Needs a `reference`.
- `item-list [ … ]` — the **Item browser/list**.
- `activity-edit [ … ]` — the **Activity editor**. `reference` optional.
- `activity-list [ … ]` — the **Activity browser/list**.

(`activity-list` is not yet modeled; its members pass through with a note.)

**Members are view-scoped, and so are their properties.** A member the view doesn't accept is
**dropped with a warning** — Learnosity ignores it in that mode. Don't attach `widget`/`settings` to a
browser view: an item browser has no widgets to edit or delete.

The subtler rule: `item` names a **different Learnosity node in each view**, with a different field
set. `config.item_edit.item` and `config.item_list.item` share exactly one field name (`status`), and
that field is a boolean in one place and a list of strings in another. So a property is legal only in
the (view, member) context where Learnosity actually defines it:

| View | Member | Properties |
| :--- | :----- | :--------- |
| `item-edit` | `item` | **panes/behaviour:** `answers` `back` `columns` `dynamic-content` `dynamic-image-tag` `enable-audio-recording` `scoring` `shared-passage` `status` `tabs` `actions-show` `popup-content-enable` `math-hints-generation-enable` · **reference:** `reference-show` `reference-edit` · `reference-prefix`(str) · **title:** `title-show` `title-edit` `title-mandatory` · **tags:** `tags-show` `tags-edit` · **save:** `save-show` `save-persist` · **duplicate:** `duplicate-show` `duplicate-shared-passages` · **editor mode:** `mode-show` · `mode-default`(`"edit"`\|`"preview"`) · **metadata pane** (each an independent show/edit pair): `details-acknowledgements-*` `details-description-*` `details-difficulty-*` `details-note-*` `details-scoring-type-*` `details-source-*` `details-status-*` |
| `item-edit` | `widget` | `edit` `delete` |
| `item-edit` | `settings` | `show` `full-height` |
| `item-list` | `item` | `url`(str, must contain `:reference`) · `enable-selection` · `status` · `title-show` `title-show-reference` |
| `item-list` | `filter-restricted` | `current-user`(bool) · `created-by`(list of str) · `status`(list of `"published"`/`"unpublished"`/`"archived"`) · `allow-filtered-tags-overwrite`(bool) |
| `item-list` | `toolbar` | `toolbar-add` `search-show` `search-status` `search-tags-show` `search-widget-type` (bool) · `search-controls`(list of str) |
| `item-list` | *(view-level)* | `limit`(num, 1–50) |
| `activity-edit` | `item` | `add-show` `edit-allow` `status-show` `title-show` `title-show-reference` `custom-points-toggle-show` `custom-points-toggle-default-checked` |
| `activity-edit` | `item-search` | `show` `back` `sort` `limit` · `title-show` `title-show-reference` · `filter-restricted-current-user` · `filter-restricted-created-by`(str list) · `toolbar-search-show` · `toolbar-search-controls`(str list) |
| `activity-edit` | `player-playback` | `show` · and `show`/`edit` pairs for `distractor-rationale-*` `distractor-rationale-response-level-*` `scroll-to-top-*` `scrolling-indicator-*` `shuffle-items-*` `skip-submit-confirmation-*` `submit-criteria-*` `warning-on-change-*` `show-acknowledgements-*` |
| `activity-edit` | `player-time` | `show` · `show`/`edit` pairs for `auto-save-*` `idle-timeout-*` `limit-type-*` `warning-time-*` · `reading-mode-goto-first-item-on-reading-time-completion-show` |
| `activity-edit` | `player-administration` | `show` · `show`/`edit` pairs for `show-exit-*` `show-extend-*` `show-save-*` |
| `activity-edit` | `player-text` `player-scoring` `duplicate` `title` | small panes — `show`, `edit`, `mandatory`, `font-size-*`, `client-side-scoring`, `deep-copy`, `duplicate-shared-passages` |
| `activity-edit` | `activity-edit-save` | `show` `persist` `restricted-tags-allow-save` |
| `activity-edit` | *(view-level)* | `back` `details` `source` `status-show` `mode-show` · `mode-default`(`"edit"`/`"preview"`) · `reference-show` `reference-edit` · `tags-show` `tags-edit` · `description-show` `description-edit` · `difficulty-show` `difficulty-edit` · `adaptive-fields-show` `annotations-enable` `reporting-enable` `override-labels-enable` `customize-presets-enable` `resource-item-show` `player-template-builder-show` `intro-item-default-checked` `outro-item-default-checked` `activity-preview-item-reference-show` · `default-player-template`(str) · `enabled-player-templates`(str list) · `activity-edit-settings` |

Note `title-show` appears in both `item` rows: it is `config.item_edit.item.title.show` in one view
and `config.item_list.item.title.show` in the other. Read the resolved path from `data.paths`.

Writing an item-edit property into an item-list `item` — `item-list [ item back true {} ]` — is
**dropped with a warning**, not passed through, and so is the converse. Emitting `config.item_list.item.back` would produce a
key Learnosity silently ignores, which under fail-open semantics is worse than an error.

**Four keywords mirror more of their Learnosity path than the others.** A keyword carries one
meaning across the whole dialect, so where a bare leaf name is already taken, the name simply
elides less of its path. Nothing is invented:

| Keyword | Learnosity path | Why not the bare name |
| :------ | :-------------- | :-------------------- |
| `filter-restricted` | `config.item_list.filter.restricted` | `filter` is L0000's list function |
| `toolbar-add` | `config.item_list.toolbar.add` | `add` is L0000's arithmetic function |
| `activity-edit-save` | `config.activity_edit.save` | `save` is a `widget-templates` property |
| `activity-edit-settings` | `config.activity_edit.settings` | `settings` is an `item-edit` member |

Note this means `toolbar-add` appears inside the `toolbar` member, which reads redundantly but
keeps every keyword decodable on its own.

**`activity-edit` is the deepest view**, so its members are cut where Learnosity panes the UI: the
player settings split into `player-playback`, `player-time`, `player-administration`, `player-text`
and `player-scoring`, while small nodes stay view-level rather than becoming one-property members.
Segments below the member flatten into the property name as everywhere else, which is why
`reading-mode-goto-first-item-on-reading-time-completion-show` is as long as it is — that is
Learnosity's own segment name, not our flattening.

## Property functions

**Top-level** (in the `author-embed` chain):
- **`domain`** (string, required) — the host serving the editor; the signature binds to it.
- **`user-id`** (string, required) — the author's stable id (recorded in the item-bank audit trail). Also `user-email`, `user-firstname`, `user-lastname` (optional).
- **`reference`** (string) — the item/activity to edit (required for `item-edit`).
- **`organisation-id`** (number) — which item bank to load from.
- **`allow-widgets`** (list of widget-type **tags**) — restrict the question types authors can add.

**Members**: see the view-scoped table above — a member's legal properties depend on the view it
appears in, and so does the type of a shared name like `status`.

**Sections** (arity-2, top level): `container` (`height`, `fixed-footer-height` numbers; `scroll-into-view-selector` string); `widget-templates` (`back`, `save`, `require-validation` booleans); `global` (`disable-onbeforeunload` boolean).

**Widget-type tags** (the DSL authoring values; each maps to Learnosity's lowercase type string — lowercase, hyphens removed): `MCQ, SHORT-TEXT, LONG-TEXT, PLAIN-TEXT, CLOZE-TEXT, CLOZE-ASSOCIATION, CLOZE-DROPDOWN, CLOZE-FORMULA, CLOZE-INLINE-TEXT, CHOICE-MATRIX, CLASSIFICATION, ORDER-LIST, SORT-LIST, FORMULA, GRAPH-PLOTTING, HIGHLIGHT-TEXT, HOTSPOT, TOKEN-HIGHLIGHT, NUMBER-LINE, ASSOCIATION, FILL-IN-THE-BLANKS, IMAGE-CLOZE-ASSOCIATION, IMAGE-CLOZE-TEXT`.

Map the client's request to the right view and set the properties they gave. **Do not invent `domain`, `user-id`, or `reference`** — omit them and the compiler flags them as design holes for the client to supply.

## Warnings are repair signals

The compiler returns `data.warnings` — imperative, specific steering hints. **Design holes (missing required properties) come first**; once filled, specificity advisories (restrict widget types, pick an item bank) surface. The client reads them and refines the design (via `update_item`) until it's complete. (A truly-unknown property is a parse error, not a warning — every valid property is a function.)

## `data.paths` gives the exact config paths — use them verbatim

The compiler also returns `data.paths`: a map from every config key the design set to its **exact
Learnosity path**, e.g. `"config.item.reference-prefix"` → `"config.item_edit.item.reference.prefix"`.
A design's kebab names are deliberately ambiguous about nesting (`title-show` is `title.show`, but
`enable-selection` is `enable_selection`), so **never derive a path from a key name — read it from
`data.paths`**. A key absent from `paths` was dropped and must not appear in the recipe at all. This
is the channel by which the recipe names config paths without guessing, which matters precisely
because the API fails open: a wrong path looks identical to a right one in a running editor.

## Canonical Learnosity Author API knowledge (the recipe draws on this)

Facts below marked **[verified]** were confirmed against the live Author API (v1.144.0) using
Learnosity's public demo consumer on `localhost`. Anything not marked verified must be presented
to the client as *documented-but-unconfirmed*, never asserted as fact.

- **Script tag [verified]:** load the Author API from the **bare host** — `<script src="https://authorapi.learnosity.com"></script>`. It defines the global `LearnosityAuthor`. Do **not** invent a versioned file path: `https://authorapi.learnosity.com/latest/authorapi.js` **404s**, `LearnosityAuthor` is then undefined, `init()` never runs, and *neither callback fires* — a silently blank page.
- **Init [verified]:** server-side, build a signed request and call `LearnosityAuthor.init(initObject, callbacks, "learnosity-author")`. `initObject = { security, request: { mode, reference?, config, user } }`.
- **Signing is SDK-handled [verified]:** use the official Learnosity **server-side SDK** for your language (.NET / Java / Node.js / PHP / Python / Ruby) to generate the `security` object from your consumer key + secret. Do not hand-roll signing unless unavoidable.
- **`security` [verified]** = `{ consumer_key, domain, timestamp (UTC, `YYYYMMDD-HHMM`), signature }`. The consumer **secret** signs the request but is **never** sent to the browser. `domain` MUST equal the host actually serving the page — a mismatch (or any tampered signature) yields Learnosity error **41003 "Signatures do not match"**. This is the **#1 cause of a failed init**.
- **`mode`** selects the view; there is no in-UI switch between the item/activity list/edit views — build a separate page/init per experience.

- **⚠ The Author API FAILS OPEN on config [verified].** An unrecognized `config` key is **silently ignored**: the editor still initializes, `readyListener` still fires, and the page looks correct — while enforcing nothing. A wrong config path therefore produces an authoring experience that *appears* restricted but is not. Never tell a client a restriction is in force unless they have observed it in the running editor.

- **⚠ Widget-type restriction: MECHANISM UNVERIFIED — do not assert a config path.**
  The previously-documented path here (`config.dependencies.question_editor_api.init_options.widgetTypes`)
  was tested against the live Author API and **does not restrict anything** — the editor loaded with all
  ten question-type groups (Math, Graphing, Chemistry, …) still on offer — identical to a control init with
  no restriction at all. These were also tested and did **not** restrict the picker:
  `config.widget_templates.widget_types` (silently ignored — not even type-checked) and
  `config.dependencies.question_editor_api.init_options.question_type_groups` (the *only* key the API
  type-checks — a non-array errors with *"question_type_groups must be an array"* — yet no valid shape tried
  had any effect on the picker).
  So: when `allow-widgets` is set, the recipe MUST state that the restriction is a **design intent whose
  Learnosity config binding is not yet confirmed**, direct the client to the Author API initialization
  reference, and make it a **verification step** ("open the widget picker and confirm only the intended
  types are offered") rather than a claim. Do not fabricate a path to fill the gap — given fail-open
  semantics, a wrong path is worse than an acknowledged unknown.

- **Widget-type name strings [verified against the published schema]:** the question `type` values below are
  Learnosity's exact lowercase strings (confirmed in `schemas.learnosity.com` → `question_type_templates`,
  which is keyed by exactly these). They are correct as *question type* identifiers; that is independent of
  the unresolved question of *which config key* accepts a restriction list. Copy them exactly — do NOT
  derive them, do NOT uppercase them, do NOT add underscores:

  | DSL tag | Learnosity question `type` value |
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

  Example: the design `allow-widgets [MCQ CLOZE-TEXT]` refers to the question types `mcq` and `clozetext` — **RIGHT**. Writing `MCQ`, `CLOZE_TEXT`, or `CLOZE-TEXT` as the Learnosity value is **WRONG**. (Which config key carries this list is the unresolved question above — name the types, don't invent the binding.)
- **Widget edit/delete permissions:** Learnosity's reference documents these at `config.item_edit.widget.edit` and `config.item_edit.widget.delete` (this also matches L0177's own `widget` member, which maps to `config.item_edit.widget`). **Not functionally verified** — the API type-checks neither, and it fails open, so treat it as documented-but-unconfirmed and make it a verification step. Do **not** use `config.widget_templates.edit`/`.delete`; that path is supported by nothing.
- **Client-side wiring [verified]:** provide a `readyListener` (fires when initialized) and an `errorListener` (`e.code` / `e.message` / `e.name`); optionally `assetRequest` (your DAM) and `customButtons`.

### Gotchas
- **wrong config key → silently ignored, restricts nothing** (fail-open). The editor loads and looks right. Only a live check of the running editor proves a restriction is in force.
- **invented script URL → blank page, no error.** `.../latest/authorapi.js` 404s; use the bare host `https://authorapi.learnosity.com`. Neither listener fires, so there is nothing in the console to lead you to the cause.
- `domain` mismatch or tampered signature → error **41003 "Signatures do not match"**.
- consumer secret exposed to the browser → security hole (server-only).
- stale/skewed timestamp → failure (use UTC, fresh per request).
- no `errorListener` → init failures are silent.

### Acceptance criteria (what "done" looks like)
- `readyListener` fires with no error and the editor renders in your target element.
- `errorListener` catches a deliberately-tampered signature (a 401-class error).
- the init payload sent to the browser contains no consumer secret.
- the `domain` in `security` equals the host serving the page.

OUT_OF_SCOPE: authoring item **content** (→ L0176); assessment delivery and analytics (future L0177 modes); emitting runnable host-language code (the recipe is language-neutral).
