<!-- SPDX-License-Identifier: CC-BY-4.0 -->
# Dialect L0177 — Learnosity Authoring Integration (recipe oracle)

L0177 does **not** author Learnosity item content. It models an authoring-**integration** operation and its parameters. The compiled output is a structural proof; the developer-facing deliverable is the **`get_spec` recipe**.

## Writing the program

A program is exactly one `integration { ... }` record, terminated with `..`:

```
integration {
  operation: "embed-editor",
  user: "u123",
  domain: "lms.acme.edu",
  widgets: ["mcq", "clozetext"]
}..
```

Fields:
- **operation** (required): one of `embed-editor`, `save-item`, `update-item`, `fetch-item`, `list-items`, `tag-items`.
- **user** (required for `embed-editor`): a stable end-user id.
- **domain** (required for `embed-editor`): the host's serving domain; it MUST equal the request's signing domain.
- **widgets** (optional): array of Learnosity widget-type keys to allow in the editor — a subset of `mcq, shorttext, longtext, clozetext, plaintext, fillintheblanks, association, choicematrix, classification, clozeassociation, clozedropdown, clozeformula, clozeinlinetext, formula, graphplotting, highlighttext, hotspot, imageclozeassociation, imageclozetext, numberline, orderlist, sortlist, tokenhighlight`.
- **itembank** (optional): `"byo"` to indicate the caller supplies their own credentials.
- **reference** (optional): an existing item reference (for `update-item` / `fetch-item`).
- **tags** (optional): array of tag strings (for `tag-items`).

Map the user's request to the closest operation and fill in the specifics they gave. Do not invent a `domain` or `user`. To supply the caller's Learnosity credentials for a live item-bank write, prefix the program with `set-var "learnosity-key" "<key>" set-var "learnosity-secret" "<secret>"` (both together).

## Canonical Learnosity authoring-integration knowledge

This is the ground truth the recipe conveys.

### Author API — embedding the item editor
- Server-side, build an `author` init request and sign it with the consumer secret. Send only the **signed request** to the browser and call `LearnosityAuthor.init(signedRequest)`.
- The signed request has a `security` object and a `request` object. `security = { consumer_key, domain, timestamp, user_id }`. The consumer **secret** is used to compute the signature but is **never** sent to the browser.
- `request.mode = "item_edit"` (or `"item_list"`); the allowed widget types go in `config.dependencies.questions_api.init_options.widgetTypes` and `config.item_edit.widget_types.enabled`.

### Signature — the exact preimage
Prefer the official Learnosity SDK for your host language; it computes this for you. If signing manually, the signature is:

```
signature = SHA256_hex( join("_", [ consumer_key, domain, timestamp, user_id, consumer_secret, request_json ]) )
```

where:
- `timestamp` is UTC in `YYYYMMDD-HHMM` format.
- `request_json` is the exact JSON string of the `request` object you transmit — byte-identical.
- `user_id` is included for user-scoped services (Author/Items); omit its slot for service requests with no user.
- Some Data API calls append an `action` ("get"/"set") as the final field of the preimage.

### Data API — item bank
- Item-bank reads/writes go through the Data API: POST form-encoded `{ security, request, action }` to `https://data.learnosity.com/<version>/itembank/items` (or `/itembank/questions`, `/itembank/tags`).
- `action`: `"get"` to read/list, `"set"` to create/update.
- Response: success is `meta.status === true`; on `false` or a non-2xx status it failed. Paginate via `meta.next`.
- Item-bank writes REQUIRE the caller's own consumer key/secret (not a shared/demo key).

### Gotchas
- The secret appears in the signature preimage but is NEVER transmitted.
- `domain` in the security object MUST equal the host actually serving the page — a mismatch is the #1 cause of a 401.
- Timestamp skew beyond Learnosity's tolerance (a few minutes) fails; use UTC and the `YYYYMMDD-HHMM` format.
- The `request` used to compute the signature must be byte-identical to the one transmitted — serialize it once.
- Saved items land as drafts (`status: unpublished`); publishing is an Author Site action.

### Acceptance criteria
- `embed-editor`: the browser `LearnosityAuthor.init` fires its ready callback with no error; mutating any signed field yields a 401; the transmitted `security` contains no secret.
- `save-item` / `list-items` / etc.: the Data API response has `meta.status === true`; a re-signed request with a tampered field is rejected.

OUT_OF_SCOPE: authoring item content (→ L0176); assessment delivery/sessions/SSO (→ L0178); analytics/reports (→ L0179); emitting host-language code (the recipe is language-neutral).
