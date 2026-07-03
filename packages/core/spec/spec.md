<!-- SPDX-License-Identifier: CC-BY-4.0 -->
# L0177 Vocabulary

**L0177** is the Learnosity Authoring Integration oracle. A program is a single
`integration { ... }` record describing one authoring-integration operation. The
compiled output is a structural proof; the developer-facing deliverable is the
`get_spec` recipe (goal, preconditions, procedure, gotchas, acceptance criteria).

The core language specification (syntax, semantics, base library) can be found here:
[Graffiticode Language Specification](./graffiticode-language-spec.html)

## `integration { … }`

The head constructor. Its record describes the operation:

| Key         | Required            | Meaning                                                        |
|-------------|---------------------|----------------------------------------------------------------|
| `operation` | yes                 | `embed-editor`, `save-item`, `update-item`, `fetch-item`, `list-items`, `tag-items` |
| `user`      | for `embed-editor`  | Stable end-user id for the Author API session.                 |
| `domain`    | for `embed-editor`  | Serving domain; must equal the request's signing domain.       |
| `widgets`   | no                  | Allowed Learnosity widget-type keys for the editor.            |
| `itembank`  | no                  | `"byo"` — the caller supplies their own credentials.           |
| `reference` | no                  | An existing item reference (`update-item` / `fetch-item`).     |
| `tags`      | no                  | Tag strings (`tag-items`).                                     |

Credentials for a live item-bank write are supplied via the base-language
`set-var "learnosity-key"` / `set-var "learnosity-secret"` (both together).
