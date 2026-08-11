<!-- SPDX-License-Identifier: CC-BY-4.0 -->
# L0177 Vocabulary

**L0177** is the Learnosity **Author API** integration oracle. A program is an
`author-embed` head with a chain of property functions and one view function. The
compiled `data` is the normalized design plus `warnings` (steering hints); the
developer-facing deliverable is the `get_spec` recipe (goal, preconditions,
procedure, gotchas, verification steps).

The core language specification (syntax, semantics, base library) is here:
[Graffiticode Language Specification](./graffiticode-language-spec.html)

## Structure

| Function | Arity | Role |
| :------- | :---: | :--- |
| `author-embed` | 1 | Head; takes the property + view chain. |
| `item-edit` `item-list` `activity-edit` `activity-list` | 2 | **Views** — take a `[list]` of members; the view selects the Learnosity mode. |
| `item` `widget` `settings` `filter-restricted` `toolbar` | 1 | **Members** — take a property chain. |
| `container` `widget-templates` `global` | 2 | **Sections** — take a property sub-chain. |

Every **property** is a lowercase-kebab **arity-2** function (`name value`) that
chains; chains terminate with `{}`. Everything is optional (smart defaults). A bare
property chain inside a view's `[list]` sets that view's own options rather than a
member's — `limit 25 {}` is `config.item_list.limit`.

## Property functions

A member's legal properties depend on the **view** it appears in: `item` names a
different Learnosity node in `item-edit` than in `item-list`, and the shared name
`status` is a boolean in one and a list of strings in the other.

| Context | Properties |
| :------ | :--------- |
| top-level (`author-embed`) | `domain`(str, req) · `user-id`(str, req) · `user-email` · `user-firstname` · `user-lastname` · `reference`(str) · `organisation-id`(num) · `allow-widgets`(tag list) |
| `item-edit` › `item` | `answers` `back` `columns` `dynamic-content` `dynamic-image-tag` `enable-audio-recording` `scoring` `shared-passage` `status` `tabs` (bool) · `reference-show` `reference-edit` (bool) · `reference-prefix`(str) · `tags-show` `tags-edit`(bool) |
| `item-edit` › `widget` | `edit` `delete` (bool) |
| `item-edit` › `settings` | `show` `full-height` (bool) |
| `item-list` › `item` | `url`(str) · `enable-selection` `status` `title-show` `title-show-reference` (bool) |
| `item-list` › `filter-restricted` | `current-user` `allow-filtered-tags-overwrite` (bool) · `created-by` `status` (str list) |
| `item-list` › `toolbar` | `toolbar-add` `search-show` `search-status` `search-tags-show` `search-widget-type` (bool) · `search-controls`(str list) |
| `item-list` (view-level) | `limit`(num) |
| `container` | `height` `fixed-footer-height`(num) · `scroll-into-view-selector`(str) |
| `widget-templates` | `back` `save` `require-validation` (bool) |
| `global` | `disable-onbeforeunload` (bool) |

`filter-restricted` and `toolbar-add` mirror more of their Learnosity path
(`filter.restricted`, `toolbar.add`) than the other keywords do, because a bare
`filter` or `add` would shadow an inherited L0000 function.

## Widget-type tags (UPPERCASE)

`MCQ`, `SHORT-TEXT`, `LONG-TEXT`, `PLAIN-TEXT`, `CLOZE-TEXT`, `CLOZE-ASSOCIATION`,
`CLOZE-DROPDOWN`, `CLOZE-FORMULA`, `CLOZE-INLINE-TEXT`, `CHOICE-MATRIX`,
`CLASSIFICATION`, `ORDER-LIST`, `SORT-LIST`, `FORMULA`, `GRAPH-PLOTTING`,
`HIGHLIGHT-TEXT`, `HOTSPOT`, `TOKEN-HIGHLIGHT`, `NUMBER-LINE`, `ASSOCIATION`,
`FILL-IN-THE-BLANKS`, `IMAGE-CLOZE-ASSOCIATION`, `IMAGE-CLOZE-TEXT`.

Function keywords are lowercase-kebab; tag values are UPPERCASE-kebab — so they
never collide. An unknown property is a parse error (every valid property is a
function).

## Example

```
author-embed
  domain "lms.example.edu"
  user-id "u123"
  reference "algebra-item-1"
  allow-widgets [MCQ CLOZE-TEXT]
  item-edit [
    item back true scoring true reference-prefix "LEAR_" {}
    widget edit true delete false {}
  ]
  {}..
```
