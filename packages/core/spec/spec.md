<!-- SPDX-License-Identifier: CC-BY-4.0 -->
# L0177 Vocabulary

**L0177** is the Learnosity **Author API** integration oracle. A program is a single
`author-*` construct describing one authoring-experience integration design. The
compiled `data` is the normalized design plus `warnings` (steering hints); the
developer-facing deliverable is the `get_spec` recipe (goal, preconditions,
procedure, gotchas, verification steps).

The core language specification (syntax, semantics, base library) is here:
[Graffiticode Language Specification](./graffiticode-language-spec.html)

## Constructs (one per Author API mode)

| Construct | View | `reference` |
|-----------|------|-------------|
| `author-item-edit { … }` | Item editor | required |
| `author-item-list { … }` | Item browser/list | n/a |
| `author-activity-edit { … }` | Activity editor | optional |
| `author-activity-list { … }` | Activity browser/list | n/a |

## Design record fields

| Key | Type | Required | Meaning |
|-----|------|----------|---------|
| `domain` | string | yes | Serving host; the signature binds to it. |
| `user` | record `{ id, email?, firstname?, lastname? }` | yes (`id`) | Author identity (audit trail). |
| `reference` | string | edit views | Item/activity to edit, or a new reference. |
| `allow_widgets` | list | no | Restrict the question types authors can add. |
| `edit_widgets`, `delete_widgets`, `edit_tags`, `show_tags`, `dynamic_content`, `shared_passage` | boolean | no | Item-editor permissions/content toggles. |
| `organisation_id` | number | no | Which item bank. |
| `locked` | boolean | no | Locked (read-only) edit mode. |
